"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { abrirProximaFatura } from "@/lib/faturas";

export type FaturaActionState = { error?: string } | undefined;

/**
 * Fecha antecipadamente a fatura corrente de um cartão (antes do periodo_fim
 * natural) e abre a próxima. Só permitido na fatura de menor periodo_fim
 * entre as abertas do cartão — faturas futuras pré-criadas por parcelamento
 * não podem ser fechadas fora de ordem.
 */
export async function fecharFaturaManualmente(
  faturaId: string
): Promise<FaturaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: fatura } = await supabase
    .from("faturas")
    .select("id, cartao_id, status")
    .eq("id", faturaId)
    .maybeSingle();

  if (!fatura || fatura.status !== "aberta") {
    return { error: "Fatura não encontrada ou já fechada." };
  }

  const { data: faturaCorrente } = await supabase
    .from("faturas")
    .select("id")
    .eq("cartao_id", fatura.cartao_id)
    .eq("status", "aberta")
    .order("periodo_fim", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!faturaCorrente || faturaCorrente.id !== faturaId) {
    return { error: "Só é possível fechar a fatura corrente do cartão." };
  }

  const { data: cartao } = await supabase
    .from("cartoes")
    .select("id, dia_fechamento, dia_vencimento, conta_pagamento_padrao_id")
    .eq("id", fatura.cartao_id)
    .single();

  if (!cartao) return { error: "Cartão não encontrado." };

  const { data: faturaFechada, error } = await supabase
    .from("faturas")
    .update({ status: "fechada" })
    .eq("id", faturaId)
    .select("periodo_fim")
    .single();

  if (error || !faturaFechada) {
    return { error: error?.message ?? "Falha ao fechar a fatura." };
  }

  const { data: proximaExistente } = await supabase
    .from("faturas")
    .select("id")
    .eq("cartao_id", cartao.id)
    .eq("status", "aberta")
    .order("periodo_fim", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!proximaExistente) {
    await abrirProximaFatura(supabase, cartao, faturaFechada);
  }

  revalidatePath("/cartoes");
  revalidatePath(`/cartoes/${fatura.cartao_id}`);
}

export async function marcarFaturaComoPaga(
  faturaId: string,
  contaPagamentoId: string
): Promise<FaturaActionState> {
  if (!contaPagamentoId) {
    return { error: "Selecione a conta usada para o pagamento." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: fatura, error } = await supabase
    .from("faturas")
    .update({ status: "paga", conta_pagamento_id: contaPagamentoId })
    .eq("id", faturaId)
    .eq("status", "fechada")
    .select("cartao_id")
    .single();

  if (error || !fatura) {
    return { error: error?.message ?? "Só é possível pagar uma fatura fechada." };
  }

  revalidatePath("/cartoes");
  revalidatePath(`/cartoes/${fatura.cartao_id}`);
}
