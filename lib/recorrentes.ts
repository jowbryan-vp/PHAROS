import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { Periodo } from "@/lib/periodo";

/**
 * Garante que exista um lançamento recorrente pendente para cada fonte de
 * receita recorrente no período atual. O trigger `trg_ciclo_gera_recorrentes`
 * já cobre a abertura de um novo ciclo (modo ciclo); esta função cobre o
 * modo calendário (sem evento de banco pra "virou o mês") e o caso de uma
 * fonte virar recorrente no meio de um período já aberto, em ambos os modos.
 * Idempotente — não duplica graças ao índice único parcial na tabela.
 */
export async function ensureRecorrentesDoPeriodo(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodo: Periodo | null
) {
  if (!periodo) return;

  const { data: fontes } = await supabase
    .from("fontes_receita")
    .select("id, valor_esperado")
    .eq("user_id", userId)
    .eq("is_recorrente", true)
    .not("valor_esperado", "is", null);

  if (!fontes || fontes.length === 0) return;

  let existentesQuery = supabase
    .from("receitas_recorrentes_lancamentos")
    .select("fonte_receita_id")
    .eq("user_id", userId);

  existentesQuery =
    periodo.modo === "ciclo" && periodo.cicloId
      ? existentesQuery.eq("ciclo_id", periodo.cicloId)
      : existentesQuery
          .is("ciclo_id", null)
          .eq("periodo_referencia", periodo.dataInicio);

  const { data: existentes } = await existentesQuery;
  const existentesIds = new Set(
    (existentes ?? []).map((e) => e.fonte_receita_id)
  );
  const faltantes = fontes.filter((f) => !existentesIds.has(f.id));

  if (faltantes.length === 0) return;

  await supabase.from("receitas_recorrentes_lancamentos").insert(
    faltantes.map((f) => ({
      user_id: userId,
      fonte_receita_id: f.id,
      ciclo_id: periodo.modo === "ciclo" ? (periodo.cicloId ?? null) : null,
      periodo_referencia: periodo.dataInicio,
      valor_esperado: f.valor_esperado!,
      status: "pendente" as const,
    }))
  );
}

export async function getTotalEsperadoNoPeriodo(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodo: Periodo | null
): Promise<number> {
  if (!periodo) return 0;

  let query = supabase
    .from("receitas_recorrentes_lancamentos")
    .select("valor_esperado")
    .eq("user_id", userId)
    .eq("status", "pendente");

  query =
    periodo.modo === "ciclo" && periodo.cicloId
      ? query.eq("ciclo_id", periodo.cicloId)
      : query.is("ciclo_id", null).eq("periodo_referencia", periodo.dataInicio);

  const { data } = await query;
  return (data ?? []).reduce((sum, r) => sum + Number(r.valor_esperado), 0);
}

function clampDay(year: number, monthIndex: number, day: number): number {
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return Math.min(day, daysInMonth);
}

/** Combina o mês/ano do período de referência com o dia esperado da fonte. */
export function computeDataEsperada(
  periodoReferencia: string,
  diaEsperado: number | null
): string | null {
  if (!diaEsperado) return null;
  const [yearStr, monthStr] = periodoReferencia.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = clampDay(year, monthIndex, diaEsperado);
  return `${yearStr}-${monthStr}-${String(day).padStart(2, "0")}`;
}
