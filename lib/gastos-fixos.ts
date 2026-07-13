import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { Periodo } from "@/lib/periodo";

/**
 * Garante que exista um lançamento pendente para cada gasto fixo ativo no
 * período atual. O trigger `trg_ciclo_gera_gastos_fixos` já cobre a
 * abertura de um novo ciclo (modo ciclo); esta função cobre o modo
 * calendário (sem evento de banco pra "virou o mês") e o caso de um gasto
 * fixo ser reativado ou criado no meio de um período já aberto, em ambos
 * os modos. Idempotente — não duplica graças aos índices únicos parciais.
 */
export async function ensureGastosFixosDoPeriodo(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodo: Periodo | null
) {
  if (!periodo) return;

  const { data: gastos } = await supabase
    .from("gastos_fixos")
    .select("id, valor")
    .eq("user_id", userId)
    .eq("ativo", true);

  if (!gastos || gastos.length === 0) return;

  let existentesQuery = supabase
    .from("gastos_fixos_lancamentos")
    .select("gasto_fixo_id")
    .eq("user_id", userId);

  existentesQuery =
    periodo.modo === "ciclo" && periodo.cicloId
      ? existentesQuery.eq("ciclo_id", periodo.cicloId)
      : existentesQuery
          .is("ciclo_id", null)
          .eq("periodo_referencia", periodo.dataInicio);

  const { data: existentes } = await existentesQuery;
  const existentesIds = new Set((existentes ?? []).map((e) => e.gasto_fixo_id));
  const faltantes = gastos.filter((g) => !existentesIds.has(g.id));

  if (faltantes.length === 0) return;

  await supabase.from("gastos_fixos_lancamentos").insert(
    faltantes.map((g) => ({
      user_id: userId,
      gasto_fixo_id: g.id,
      ciclo_id: periodo.modo === "ciclo" ? (periodo.cicloId ?? null) : null,
      periodo_referencia: periodo.dataInicio,
      valor: g.valor,
      status: "pendente" as const,
    }))
  );
}

export type LancamentoGastoFixo = {
  id: string;
  gasto_fixo_id: string;
  valor: number;
  status: "pendente" | "pago";
  conta_pagamento_id: string | null;
  data_pagamento: string | null;
  nome_gasto: string;
  conta_pagamento_padrao_id: string | null;
};

/** Lançamentos (pendentes e pagos) do gasto fixo pro período informado. */
export async function getLancamentosDoPeriodo(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodo: Periodo
): Promise<LancamentoGastoFixo[]> {
  let query = supabase
    .from("gastos_fixos_lancamentos")
    .select(
      "id, gasto_fixo_id, valor, status, conta_pagamento_id, data_pagamento, gastos_fixos(nome, conta_pagamento_padrao_id)"
    )
    .eq("user_id", userId);

  query =
    periodo.modo === "ciclo" && periodo.cicloId
      ? query.eq("ciclo_id", periodo.cicloId)
      : query.is("ciclo_id", null).eq("periodo_referencia", periodo.dataInicio);

  const { data } = await query;

  return (data ?? []).map((l) => ({
    id: l.id,
    gasto_fixo_id: l.gasto_fixo_id,
    valor: l.valor,
    status: l.status,
    conta_pagamento_id: l.conta_pagamento_id,
    data_pagamento: l.data_pagamento,
    nome_gasto: l.gastos_fixos?.nome ?? "",
    conta_pagamento_padrao_id: l.gastos_fixos?.conta_pagamento_padrao_id ?? null,
  }));
}

export async function getResumoDoPeriodo(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodo: Periodo | null
): Promise<{ totalPendente: number; totalPago: number }> {
  if (!periodo) return { totalPendente: 0, totalPago: 0 };

  let query = supabase
    .from("gastos_fixos_lancamentos")
    .select("valor, status")
    .eq("user_id", userId);

  query =
    periodo.modo === "ciclo" && periodo.cicloId
      ? query.eq("ciclo_id", periodo.cicloId)
      : query.is("ciclo_id", null).eq("periodo_referencia", periodo.dataInicio);

  const { data } = await query;

  return (data ?? []).reduce(
    (acc, l) => {
      if (l.status === "pago") acc.totalPago += Number(l.valor);
      else acc.totalPendente += Number(l.valor);
      return acc;
    },
    { totalPendente: 0, totalPago: 0 }
  );
}

export type ProjecaoGastoFixo = {
  gastoFixoId: string;
  nomeGasto: string;
  valor: number;
};

/**
 * Projeção em memória dos gastos fixos ativos pro período de referência
 * informado — usada quando um período futuro ainda não tem lançamentos
 * reais gerados (a geração só acontece quando o período vira o atual).
 */
export async function getProjecaoGastosFixos(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ProjecaoGastoFixo[]> {
  const { data: gastos } = await supabase
    .from("gastos_fixos")
    .select("id, nome, valor")
    .eq("user_id", userId)
    .eq("ativo", true);

  return (gastos ?? []).map((g) => ({
    gastoFixoId: g.id,
    nomeGasto: g.nome,
    valor: g.valor,
  }));
}
