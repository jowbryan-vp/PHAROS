import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { Periodo } from "@/lib/periodo";

export type ContribuicaoPeriodo = {
  id: string;
  receita_id: string;
  valor_sugerido: number;
  valor_final: number;
  status: "comprometido" | "pago";
  data_pagamento: string | null;
  conta_pagamento_id: string | null;
  receita_valor: number;
  receita_data: string;
  nome_fonte: string;
};

/**
 * Contribuições do período informado — filtradas pela data_recebimento da
 * receita de origem (contribuicoes não tem periodo_referencia/ciclo_id
 * próprio, ao contrário de receitas_recorrentes_lancamentos e
 * gastos_fixos_lancamentos, porque nasce sempre atrelada a uma receita já
 * lançada, nunca projetada por período).
 */
export async function getContribuicoesDoPeriodo(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodo: Periodo
): Promise<ContribuicaoPeriodo[]> {
  let query = supabase
    .from("contribuicoes")
    .select(
      "id, receita_id, valor_sugerido, valor_final, status, data_pagamento, conta_pagamento_id, receitas!inner(valor, data_recebimento, fontes_receita(nome))"
    )
    .eq("user_id", userId)
    .gte("receitas.data_recebimento", periodo.dataInicio);

  if (periodo.dataFim) {
    query = query.lte("receitas.data_recebimento", periodo.dataFim);
  }

  const { data } = await query;

  return (data ?? []).map((c) => ({
    id: c.id,
    receita_id: c.receita_id,
    valor_sugerido: c.valor_sugerido,
    valor_final: c.valor_final,
    status: c.status,
    data_pagamento: c.data_pagamento,
    conta_pagamento_id: c.conta_pagamento_id,
    receita_valor: c.receitas?.valor ?? 0,
    receita_data: c.receitas?.data_recebimento ?? "",
    nome_fonte: c.receitas?.fontes_receita?.nome ?? "",
  }));
}

export async function getResumoContribuicaoDoPeriodo(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodo: Periodo | null
): Promise<{ totalComprometido: number; totalPago: number }> {
  if (!periodo) return { totalComprometido: 0, totalPago: 0 };

  let query = supabase
    .from("contribuicoes")
    .select("valor_final, status, receitas!inner(data_recebimento)")
    .eq("user_id", userId)
    .gte("receitas.data_recebimento", periodo.dataInicio);

  if (periodo.dataFim) {
    query = query.lte("receitas.data_recebimento", periodo.dataFim);
  }

  const { data } = await query;

  return (data ?? []).reduce(
    (acc, c) => {
      if (c.status === "pago") acc.totalPago += Number(c.valor_final);
      else acc.totalComprometido += Number(c.valor_final);
      return acc;
    },
    { totalComprometido: 0, totalPago: 0 }
  );
}
