import { createClient } from "@/lib/supabase/server";
import { ReceitasManager } from "@/components/features/receitas-manager";
import { getPeriodoAtual, formatPeriodoLabel } from "@/lib/periodo";
import { ensureRecorrentesDoPeriodo, computeDataEsperada } from "@/lib/recorrentes";

export default async function ReceitasLancamentosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("modo_financeiro")
    .eq("id", user!.id)
    .single();

  const periodo = await getPeriodoAtual(
    supabase,
    user!.id,
    profile?.modo_financeiro ?? null
  );

  await ensureRecorrentesDoPeriodo(supabase, user!.id, periodo);

  const pendentesQuery = periodo
    ? (() => {
        const q = supabase
          .from("receitas_recorrentes_lancamentos")
          .select(
            "id, fonte_receita_id, valor_esperado, periodo_referencia, fontes_receita(nome, dia_esperado)"
          )
          .eq("user_id", user!.id)
          .eq("status", "pendente");
        return periodo.modo === "ciclo" && periodo.cicloId
          ? q.eq("ciclo_id", periodo.cicloId)
          : q.is("ciclo_id", null).eq("periodo_referencia", periodo.dataInicio);
      })()
    : null;

  const [fontesRes, contasRes, receitasRes, pendentesRes] = await Promise.all([
    supabase
      .from("fontes_receita")
      .select("id, nome, tributavel_padrao")
      .eq("user_id", user!.id)
      .order("criado_em", { ascending: true }),
    supabase
      .from("contas")
      .select("id, nome")
      .eq("user_id", user!.id)
      .order("criado_em", { ascending: true }),
    supabase
      .from("receitas")
      .select(
        "id, fonte_receita_id, conta_id, valor, data_recebimento, tributavel, observacao, fontes_receita(nome), contas(nome)"
      )
      .eq("user_id", user!.id)
      .order("data_recebimento", { ascending: false })
      .order("criado_em", { ascending: false }),
    pendentesQuery,
  ]);

  const periodoLabel = periodo
    ? formatPeriodoLabel(periodo)
    : "Nenhum ciclo iniciado ainda — o primeiro lançamento da fonte principal vai abrir o ciclo.";

  const pendentes = (pendentesRes?.data ?? []).map((p) => ({
    id: p.id,
    fonte_receita_id: p.fonte_receita_id,
    valor_esperado: p.valor_esperado,
    nome_fonte: p.fontes_receita?.nome ?? "",
    dataSugerida: computeDataEsperada(
      p.periodo_referencia,
      p.fontes_receita?.dia_esperado ?? null
    ),
  }));

  const totalEsperado = pendentes.reduce((sum, p) => sum + p.valor_esperado, 0);

  return (
    <ReceitasManager
      receitas={receitasRes.data ?? []}
      fontes={fontesRes.data ?? []}
      contas={contasRes.data ?? []}
      periodoLabel={periodoLabel}
      pendentes={pendentes}
      totalEsperado={totalEsperado}
    />
  );
}
