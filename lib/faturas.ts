import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { toISODate } from "@/lib/periodo";
import type { Periodo } from "@/lib/periodo";

type Cartao = Database["public"]["Tables"]["cartoes"]["Row"];
type Fatura = Database["public"]["Tables"]["faturas"]["Row"];

const DIA_EM_MS = 24 * 60 * 60 * 1000;

function clampDay(year: number, monthIndex: number, day: number): number {
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return Math.min(day, daysInMonth);
}

/** Data UTC do dia `day` no mês `monthIndex`/`year`, com overflow de mês
 * normalizado pelo próprio `Date.UTC` e o dia limitado ao fim do mês. */
function dateForDay(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, clampDay(year, monthIndex, day)));
}

/**
 * Data de vencimento da fatura: mesmo dia_vencimento, no primeiro mês (a
 * partir do mês de periodo_fim) em que a data resultante cai depois do
 * fechamento — cobre tanto vencimento no mesmo mês (dia_vencimento >
 * dia_fechamento) quanto no mês seguinte (caso mais comum na prática).
 */
function computeVencimento(periodoFim: Date, diaVencimento: number): Date {
  const mesmoMes = dateForDay(
    periodoFim.getUTCFullYear(),
    periodoFim.getUTCMonth(),
    diaVencimento
  );
  if (mesmoMes.getTime() > periodoFim.getTime()) return mesmoMes;
  return dateForDay(
    periodoFim.getUTCFullYear(),
    periodoFim.getUTCMonth() + 1,
    diaVencimento
  );
}

/** O ciclo (periodo_inicio/periodo_fim) que está aberto na data de referência. */
function computeCicloAberto(
  dataRef: Date,
  diaFechamento: number
): { periodoInicio: Date; periodoFim: Date } {
  const fechamentoEsteMes = dateForDay(
    dataRef.getUTCFullYear(),
    dataRef.getUTCMonth(),
    diaFechamento
  );
  const periodoFim =
    dataRef.getTime() <= fechamentoEsteMes.getTime()
      ? fechamentoEsteMes
      : dateForDay(dataRef.getUTCFullYear(), dataRef.getUTCMonth() + 1, diaFechamento);

  const fechamentoMesAnterior = dateForDay(
    periodoFim.getUTCFullYear(),
    periodoFim.getUTCMonth() - 1,
    diaFechamento
  );
  const periodoInicio = new Date(fechamentoMesAnterior.getTime() + DIA_EM_MS);

  return { periodoInicio, periodoFim };
}

/** O ciclo seguinte a uma fatura já fechada. */
function computeProximoCiclo(
  faturaAnterior: Pick<Fatura, "periodo_fim">,
  diaFechamento: number
): { periodoInicio: Date; periodoFim: Date } {
  const fimAnterior = new Date(`${faturaAnterior.periodo_fim}T00:00:00Z`);
  const periodoInicio = new Date(fimAnterior.getTime() + DIA_EM_MS);
  const periodoFim = dateForDay(
    periodoInicio.getUTCFullYear(),
    periodoInicio.getUTCMonth(),
    diaFechamento
  );
  return { periodoInicio, periodoFim };
}

async function inserirFatura(
  supabase: SupabaseClient<Database>,
  cartao: Pick<Cartao, "id" | "dia_vencimento" | "conta_pagamento_padrao_id">,
  periodoInicio: Date,
  periodoFim: Date
): Promise<Fatura> {
  const dataVencimento = computeVencimento(periodoFim, cartao.dia_vencimento);
  const { data, error } = await supabase
    .from("faturas")
    .insert({
      cartao_id: cartao.id,
      periodo_inicio: toISODate(periodoInicio),
      periodo_fim: toISODate(periodoFim),
      data_vencimento: toISODate(dataVencimento),
      status: "aberta",
      conta_pagamento_id: cartao.conta_pagamento_padrao_id,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Falha ao criar fatura.");
  }
  return data;
}

/** Cria a primeira fatura (aberta) de um cartão recém-cadastrado. */
export async function criarFaturaInicial(
  supabase: SupabaseClient<Database>,
  cartao: Pick<Cartao, "id" | "dia_fechamento" | "dia_vencimento" | "conta_pagamento_padrao_id">
): Promise<Fatura> {
  const { periodoInicio, periodoFim } = computeCicloAberto(new Date(), cartao.dia_fechamento);
  return inserirFatura(supabase, cartao, periodoInicio, periodoFim);
}

/** Abre a fatura do ciclo seguinte ao de `faturaAnterior`. */
export async function abrirProximaFatura(
  supabase: SupabaseClient<Database>,
  cartao: Pick<Cartao, "id" | "dia_fechamento" | "dia_vencimento" | "conta_pagamento_padrao_id">,
  faturaAnterior: Pick<Fatura, "periodo_fim">
): Promise<Fatura> {
  const { periodoInicio, periodoFim } = computeProximoCiclo(faturaAnterior, cartao.dia_fechamento);
  return inserirFatura(supabase, cartao, periodoInicio, periodoFim);
}

/**
 * Garante que o estado de faturas do usuário está em dia: fecha (status =
 * 'fechada') qualquer fatura aberta cujo periodo_fim já passou e abre a
 * próxima, repetindo até não haver mais atraso (cobre o usuário que fica
 * meses sem acessar o app). Não há cron — essa rotina roda de forma
 * preguiçosa a cada carregamento de página que dependa de faturas.
 *
 * Um cartão pode ter mais de uma fatura 'aberta' simultaneamente (faturas
 * futuras pré-criadas por causa de parcelamento), então a fatura "corrente"
 * de cada cartão é sempre a de menor periodo_fim entre as abertas — não a
 * mais recente.
 */
export async function ensureFaturasAtualizadas(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { data: cartoes } = await supabase
    .from("cartoes")
    .select("id, dia_fechamento, dia_vencimento, conta_pagamento_padrao_id")
    .eq("user_id", userId);

  if (!cartoes || cartoes.length === 0) return;

  const hojeISO = toISODate(new Date());

  for (const cartao of cartoes) {
    for (;;) {
      const { data: aberta } = await supabase
        .from("faturas")
        .select("id, periodo_inicio, periodo_fim")
        .eq("cartao_id", cartao.id)
        .eq("status", "aberta")
        .order("periodo_fim", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!aberta) {
        await criarFaturaInicial(supabase, cartao);
        break;
      }

      if (aberta.periodo_fim >= hojeISO) break;

      await supabase.from("faturas").update({ status: "fechada" }).eq("id", aberta.id);

      const { data: proximaExistente } = await supabase
        .from("faturas")
        .select("id")
        .eq("cartao_id", cartao.id)
        .eq("status", "aberta")
        .order("periodo_fim", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!proximaExistente) {
        await abrirProximaFatura(supabase, cartao, aberta);
      }
    }
  }
}

export async function getValorTotalFatura(
  supabase: SupabaseClient<Database>,
  faturaId: string
): Promise<number> {
  const { data } = await supabase
    .from("lancamentos_fatura")
    .select("valor")
    .eq("fatura_id", faturaId);

  return (data ?? []).reduce((sum, l) => sum + Number(l.valor), 0);
}

/**
 * Garante que existam faturas 'aberta' cobrindo os próximos `quantidade`
 * ciclos a partir da fatura corrente (inclusive), criando as que faltarem.
 * Usado pelo lançamento parcelado, que precisa anexar cada parcela futura à
 * fatura do mês correspondente antes mesmo de o ciclo atual fechar.
 */
export async function getOrCriarProximasFaturas(
  supabase: SupabaseClient<Database>,
  cartao: Pick<Cartao, "id" | "dia_fechamento" | "dia_vencimento" | "conta_pagamento_padrao_id">,
  quantidade: number
): Promise<Fatura[]> {
  const { data: existentes } = await supabase
    .from("faturas")
    .select("*")
    .eq("cartao_id", cartao.id)
    .order("periodo_fim", { ascending: true });

  const faturas = [...(existentes ?? [])];
  const abertas = faturas.filter((f) => f.status === "aberta");

  while (abertas.length < quantidade) {
    const ultima = abertas[abertas.length - 1];
    const nova = ultima
      ? await abrirProximaFatura(supabase, cartao, ultima)
      : await criarFaturaInicial(supabase, cartao);
    faturas.push(nova);
    abertas.push(nova);
  }

  return abertas.slice(0, quantidade);
}

export type ResumoFaturasPeriodo = {
  totalAberto: number;
  totalAPagar: number;
  totalPago: number;
};

/**
 * Soma o valor das faturas do usuário (todos os cartões) cuja
 * data_vencimento cai dentro do período informado, agrupado por status.
 * Usado pelo card de Cartões/Faturas do Dashboard — não é a mesma noção de
 * "fatura corrente" de ensureFaturasAtualizadas, é um corte por vencimento
 * dentro do período navegado.
 */
export async function getResumoFaturasDoPeriodo(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodo: Periodo | null
): Promise<ResumoFaturasPeriodo> {
  if (!periodo) return { totalAberto: 0, totalAPagar: 0, totalPago: 0 };

  let query = supabase
    .from("faturas")
    .select("status, lancamentos_fatura(valor), cartoes!inner(user_id)")
    .eq("cartoes.user_id", userId)
    .gte("data_vencimento", periodo.dataInicio);

  if (periodo.dataFim) {
    query = query.lte("data_vencimento", periodo.dataFim);
  }

  const { data } = await query;

  return (data ?? []).reduce<ResumoFaturasPeriodo>(
    (acc, f) => {
      const total = (f.lancamentos_fatura ?? []).reduce(
        (sum, l) => sum + Number(l.valor),
        0
      );
      if (f.status === "aberta") acc.totalAberto += total;
      else if (f.status === "fechada") acc.totalAPagar += total;
      else if (f.status === "paga") acc.totalPago += total;
      return acc;
    },
    { totalAberto: 0, totalAPagar: 0, totalPago: 0 }
  );
}
