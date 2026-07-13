"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/periodo";

export type ReceitaActionState = { error?: string } | undefined;
export type DeleteReceitaResult = { warning?: string } | undefined;

export async function saveReceita(
  _prevState: ReceitaActionState,
  formData: FormData
): Promise<ReceitaActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const fonteReceitaId = String(formData.get("fonte_receita_id") ?? "").trim();
  const contaId = String(formData.get("conta_id") ?? "").trim();
  const valorRaw = String(formData.get("valor") ?? "").trim();
  const dataRecebimento = String(formData.get("data_recebimento") ?? "").trim();
  const tributavel = formData.get("tributavel") === "on";
  const observacao = String(formData.get("observacao") ?? "").trim();
  const recorrenteLancamentoId = String(
    formData.get("recorrente_lancamento_id") ?? ""
  ).trim();

  if (!fonteReceitaId || !contaId || !dataRecebimento) {
    return { error: "Preencha fonte, conta e data de recebimento." };
  }

  const valor = Number(valorRaw.replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    return { error: "Informe um valor válido, maior que zero." };
  }

  if (dataRecebimento > toISODate(new Date())) {
    return {
      error:
        "Data de recebimento não pode ser futura — receitas representam um valor já recebido. Para uma expectativa futura, use a confirmação de recebimento recorrente esperado.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const payload = {
    fonte_receita_id: fonteReceitaId,
    conta_id: contaId,
    valor,
    data_recebimento: dataRecebimento,
    tributavel,
    observacao: observacao || null,
  };

  if (id) {
    const { error } = await supabase
      .from("receitas")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  } else {
    const { data: novaReceita, error } = await supabase
      .from("receitas")
      .insert({ ...payload, user_id: user.id })
      .select("id")
      .single();

    if (error) return { error: error.message };

    if (recorrenteLancamentoId && novaReceita) {
      await supabase
        .from("receitas_recorrentes_lancamentos")
        .update({ status: "recebido", receita_id: novaReceita.id })
        .eq("id", recorrenteLancamentoId)
        .eq("user_id", user.id);
    }
  }

  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}

/**
 * Exclui uma receita. Se ela for a âncora do ciclo atualmente aberto (e só
 * nesse caso — nunca para um ciclo já fechado por outro lançamento), e
 * nenhum outro dado tiver sido gerado dentro desse ciclo, o ciclo órfão é
 * removido e o ciclo anterior é reaberto (data_fim = null), restaurando o
 * estado de "em andamento" que existia antes do lançamento indevido.
 *
 * Se o ciclo ancorado por essa receita tiver outros lançamentos
 * dependentes (receitas, recorrentes, gastos fixos gerados dentro dele) ou
 * já estiver fechado por um lançamento mais recente, não mexe no ciclo —
 * só apaga a receita e avisa o usuário pra revisar manualmente.
 */
export async function deleteReceita(id: string): Promise<DeleteReceitaResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: cicloAncorado } = await supabase
    .from("ciclos")
    .select("id, data_inicio, data_fim")
    .eq("user_id", user.id)
    .eq("receita_ancora_id", id)
    .maybeSingle();

  if (!cicloAncorado) {
    await supabase.from("receitas").delete().eq("id", id).eq("user_id", user.id);
    revalidatePath("/receitas");
    revalidatePath("/dashboard");
    return;
  }

  const [{ count: recorrentesCount }, { count: gastosCount }] = await Promise.all([
    supabase
      .from("receitas_recorrentes_lancamentos")
      .select("id", { count: "exact", head: true })
      .eq("ciclo_id", cicloAncorado.id),
    supabase
      .from("gastos_fixos_lancamentos")
      .select("id", { count: "exact", head: true })
      .eq("ciclo_id", cicloAncorado.id),
  ]);

  let outrasReceitasQuery = supabase
    .from("receitas")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("id", id)
    .gte("data_recebimento", cicloAncorado.data_inicio);

  if (cicloAncorado.data_fim) {
    outrasReceitasQuery = outrasReceitasQuery.lte(
      "data_recebimento",
      cicloAncorado.data_fim
    );
  }

  const { count: outrasReceitasCount } = await outrasReceitasQuery;

  const temDependentes =
    (recorrentesCount ?? 0) > 0 ||
    (gastosCount ?? 0) > 0 ||
    (outrasReceitasCount ?? 0) > 0;

  // Só cascateia quando o ciclo ancorado é o aberto (data_fim null) — um
  // ciclo já fechado por um lançamento mais recente não deve ser removido
  // nem "reaberto" só porque perdeu a receita que o originou.
  if (temDependentes || cicloAncorado.data_fim !== null) {
    await supabase.from("receitas").delete().eq("id", id).eq("user_id", user.id);
    revalidatePath("/receitas");
    revalidatePath("/dashboard");
    return {
      warning:
        "Essa receita tinha aberto um ciclo que já não pôde ser removido automaticamente (tem outros lançamentos dentro dele, ou já foi fechado por um recebimento mais recente). A receita foi excluída, mas revise os ciclos manualmente se necessário.",
    };
  }

  const { data: cicloAnterior } = await supabase
    .from("ciclos")
    .select("id")
    .eq("user_id", user.id)
    .lt("data_inicio", cicloAncorado.data_inicio)
    .order("data_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("ciclos").delete().eq("id", cicloAncorado.id).eq("user_id", user.id);
  await supabase.from("receitas").delete().eq("id", id).eq("user_id", user.id);

  if (cicloAnterior) {
    await supabase
      .from("ciclos")
      .update({ data_fim: null })
      .eq("id", cicloAnterior.id)
      .eq("user_id", user.id);
  }

  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}
