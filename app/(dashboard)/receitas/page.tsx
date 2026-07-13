import { createClient } from "@/lib/supabase/server";
import { ReceitasManager } from "@/components/features/receitas-manager";
import { getPeriodoAtual, formatPeriodoLabel } from "@/lib/periodo";

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

  const [fontesRes, contasRes, receitasRes, periodo] = await Promise.all([
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
    getPeriodoAtual(supabase, user!.id, profile?.modo_financeiro ?? null),
  ]);

  const periodoLabel = periodo
    ? formatPeriodoLabel(periodo)
    : "Nenhum ciclo iniciado ainda — o primeiro lançamento da fonte principal vai abrir o ciclo.";

  return (
    <ReceitasManager
      receitas={receitasRes.data ?? []}
      fontes={fontesRes.data ?? []}
      contas={contasRes.data ?? []}
      periodoLabel={periodoLabel}
    />
  );
}
