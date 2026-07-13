import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ModoFinanceiro } from "@/types/supabase";

export type Periodo = {
  modo: ModoFinanceiro;
  dataInicio: string;
  dataFim: string | null;
  /** Só presente em modo "ciclo" — id da linha em `ciclos`. */
  cicloId?: string | null;
};

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getMesAtualRange(): { inicio: string; fim: string } {
  const now = new Date();
  const inicio = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const fim = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
  return { inicio: toISODate(inicio), fim: toISODate(fim) };
}

/**
 * Retorna o período financeiro atual do usuário.
 * - modo "calendario": sempre o mês corrente (dia 1 ao último dia), calculado
 *   na hora — não depende da tabela `ciclos`.
 * - modo "ciclo": o ciclo aberto (data_fim null) mais recente, se existir.
 *   Retorna null se ainda não há nenhum ciclo iniciado (nenhum lançamento da
 *   fonte principal até agora).
 */
export async function getPeriodoAtual(
  supabase: SupabaseClient<Database>,
  userId: string,
  modoFinanceiro: ModoFinanceiro | null
): Promise<Periodo | null> {
  if (modoFinanceiro !== "ciclo") {
    const { inicio, fim } = getMesAtualRange();
    return { modo: "calendario", dataInicio: inicio, dataFim: fim };
  }

  const { data: ciclo } = await supabase
    .from("ciclos")
    .select("id, data_inicio, data_fim")
    .eq("user_id", userId)
    .is("data_fim", null)
    .order("data_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ciclo) return null;

  return {
    modo: "ciclo",
    dataInicio: ciclo.data_inicio,
    dataFim: ciclo.data_fim,
    cicloId: ciclo.id,
  };
}

export function formatDateBR(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function formatPeriodoLabel(periodo: Periodo): string {
  if (periodo.modo === "calendario") {
    const [year, month] = periodo.dataInicio.split("-");
    return `Mês de ${MESES[Number(month) - 1]}/${year}`;
  }

  const inicio = formatDateBR(periodo.dataInicio);
  const fim = periodo.dataFim ? formatDateBR(periodo.dataFim) : "em andamento";
  return `${inicio} até ${fim}`;
}

export async function getTotalRecebidoNoPeriodo(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodo: Periodo
): Promise<number> {
  let query = supabase
    .from("receitas")
    .select("valor")
    .eq("user_id", userId)
    .gte("data_recebimento", periodo.dataInicio);

  if (periodo.dataFim) {
    query = query.lte("data_recebimento", periodo.dataFim);
  }

  const { data } = await query;
  return (data ?? []).reduce((sum, r) => sum + Number(r.valor), 0);
}
