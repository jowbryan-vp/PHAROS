import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ModoFinanceiro } from "@/types/supabase";
import { toISODate, formatDateBR, MESES } from "@/lib/periodo";
import { computeDataEsperada } from "@/lib/recorrentes";

export type PeriodoView = {
  modo: ModoFinanceiro;
  dataInicio: string;
  dataFim: string | null;
  label: string;
  /** É exatamente o período real de hoje (ciclo aberto ou mês corrente). */
  isAtual: boolean;
  /** Período futuro — os valores exibidos são projeção, não dado real. */
  isProjetado: boolean;
  cicloId: string | null;
  prevHref: string | null;
  nextHref: string | null;
};

export type ProjecaoRecorrente = {
  fonteReceitaId: string;
  nomeFonte: string;
  valorEsperado: number;
  dataSugerida: string | null;
};

function addMonths(anoMes: string, delta: number): string {
  const [year, month] = anoMes.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function mesRange(anoMes: string): { inicio: string; fim: string } {
  const [year, month] = anoMes.split("-").map(Number);
  const inicio = new Date(Date.UTC(year, month - 1, 1));
  const fim = new Date(Date.UTC(year, month, 0));
  return { inicio: toISODate(inicio), fim: toISODate(fim) };
}

function currentAnoMes(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return toISODate(d);
}

function diffDaysInclusive(inicio: string, fim: string): number {
  const [iy, im, id] = inicio.split("-").map(Number);
  const [fy, fm, fd] = fim.split("-").map(Number);
  const a = Date.UTC(iy, im - 1, id);
  const b = Date.UTC(fy, fm - 1, fd);
  return Math.round((b - a) / 86_400_000) + 1;
}

function formatMesLabel(anoMes: string): string {
  const [year, month] = anoMes.split("-");
  return `Mês de ${MESES[Number(month) - 1]}/${year}`;
}

function resolveCalendarioView(paramP: string | undefined): PeriodoView {
  const atual = currentAnoMes();
  const anoMes = paramP && /^\d{4}-\d{2}$/.test(paramP) ? paramP : atual;
  const { inicio, fim } = mesRange(anoMes);

  return {
    modo: "calendario",
    dataInicio: inicio,
    dataFim: fim,
    label: formatMesLabel(anoMes),
    isAtual: anoMes === atual,
    isProjetado: anoMes > atual,
    cicloId: null,
    prevHref: `?p=${addMonths(anoMes, -1)}`,
    nextHref: `?p=${addMonths(anoMes, 1)}`,
  };
}

type CicloRow = { id: string; data_inicio: string; data_fim: string | null };

async function getCicloAberto(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CicloRow | null> {
  const { data } = await supabase
    .from("ciclos")
    .select("id, data_inicio, data_fim")
    .eq("user_id", userId)
    .is("data_fim", null)
    // Nunca considera "atual"/aberto um ciclo ancorado no futuro.
    .lte("data_inicio", toISODate(new Date()))
    .order("data_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function getCicloPorId(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<CicloRow | null> {
  const { data } = await supabase
    .from("ciclos")
    .select("id, data_inicio, data_fim")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function getCicloAnterior(
  supabase: SupabaseClient<Database>,
  userId: string,
  dataInicioRef: string
): Promise<CicloRow | null> {
  const { data } = await supabase
    .from("ciclos")
    .select("id, data_inicio, data_fim")
    .eq("user_id", userId)
    .lt("data_inicio", dataInicioRef)
    .order("data_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function getCicloPosterior(
  supabase: SupabaseClient<Database>,
  userId: string,
  dataInicioRef: string
): Promise<CicloRow | null> {
  const { data } = await supabase
    .from("ciclos")
    .select("id, data_inicio, data_fim")
    .eq("user_id", userId)
    .gt("data_inicio", dataInicioRef)
    .order("data_inicio", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

async function getDuracaoUltimoCicloCompleto(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number | null> {
  const { data } = await supabase
    .from("ciclos")
    .select("data_inicio, data_fim")
    .eq("user_id", userId)
    .not("data_fim", "is", null)
    .order("data_fim", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !data.data_fim) return null;
  return diffDaysInclusive(data.data_inicio, data.data_fim);
}

async function resolveCicloProjecao(
  supabase: SupabaseClient<Database>,
  userId: string,
  n: number
): Promise<PeriodoView | null> {
  const aberto = await getCicloAberto(supabase, userId);
  if (!aberto) return null;

  const duracao = await getDuracaoUltimoCicloCompleto(supabase, userId);
  if (!duracao) return null;

  const inicio = addDays(aberto.data_inicio, duracao * n);
  const fim = addDays(inicio, duracao - 1);

  return {
    modo: "ciclo",
    dataInicio: inicio,
    dataFim: fim,
    label: `${formatDateBR(inicio)} até ${formatDateBR(fim)} (estimado)`,
    isAtual: false,
    isProjetado: true,
    cicloId: null,
    prevHref: n > 1 ? `?p=proj:${n - 1}` : `?p=ciclo:${aberto.id}`,
    nextHref: `?p=proj:${n + 1}`,
  };
}

async function resolveCicloView(
  supabase: SupabaseClient<Database>,
  userId: string,
  paramP: string | undefined
): Promise<PeriodoView | null> {
  if (paramP?.startsWith("proj:")) {
    const n = Math.max(1, parseInt(paramP.slice(5), 10) || 1);
    return resolveCicloProjecao(supabase, userId, n);
  }

  const cicloId = paramP?.startsWith("ciclo:") ? paramP.slice(6) : null;

  const ciclo = cicloId
    ? await getCicloPorId(supabase, userId, cicloId)
    : await getCicloAberto(supabase, userId);

  if (!ciclo) return null;

  const isAtual = ciclo.data_fim === null;

  const [cicloAnterior, cicloPosterior, duracaoUltimo] = await Promise.all([
    getCicloAnterior(supabase, userId, ciclo.data_inicio),
    isAtual
      ? Promise.resolve(null)
      : getCicloPosterior(supabase, userId, ciclo.data_inicio),
    isAtual ? getDuracaoUltimoCicloCompleto(supabase, userId) : Promise.resolve(null),
  ]);

  return {
    modo: "ciclo",
    dataInicio: ciclo.data_inicio,
    dataFim: ciclo.data_fim,
    label: `${formatDateBR(ciclo.data_inicio)} até ${
      ciclo.data_fim ? formatDateBR(ciclo.data_fim) : "em andamento"
    }`,
    isAtual,
    isProjetado: false,
    cicloId: ciclo.id,
    prevHref: cicloAnterior ? `?p=ciclo:${cicloAnterior.id}` : null,
    nextHref: isAtual
      ? duracaoUltimo
        ? "?p=proj:1"
        : null
      : cicloPosterior
        ? `?p=ciclo:${cicloPosterior.id}`
        : null,
  };
}

export async function resolvePeriodoView(
  supabase: SupabaseClient<Database>,
  userId: string,
  modoFinanceiro: ModoFinanceiro | null,
  paramP: string | undefined
): Promise<PeriodoView | null> {
  if (modoFinanceiro !== "ciclo") {
    return resolveCalendarioView(paramP);
  }
  return resolveCicloView(supabase, userId, paramP);
}

/**
 * Projeção em memória das receitas recorrentes pro período de referência
 * informado — usada quando um período futuro ainda não tem lançamentos
 * recorrentes reais gerados (a geração só acontece quando o período vira
 * o atual de fato).
 */
export async function getProjecaoRecorrentes(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodoReferencia: string
): Promise<ProjecaoRecorrente[]> {
  const { data: fontes } = await supabase
    .from("fontes_receita")
    .select("id, nome, valor_esperado, dia_esperado")
    .eq("user_id", userId)
    .eq("is_recorrente", true)
    .not("valor_esperado", "is", null);

  return (fontes ?? []).map((f) => ({
    fonteReceitaId: f.id,
    nomeFonte: f.nome,
    valorEsperado: f.valor_esperado!,
    dataSugerida: computeDataEsperada(periodoReferencia, f.dia_esperado),
  }));
}
