"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReceitaActionState = { error?: string } | undefined;

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

export async function deleteReceita(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("receitas")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/receitas");
  revalidatePath("/dashboard");
}
