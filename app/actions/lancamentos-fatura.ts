"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrCriarProximasFaturas } from "@/lib/faturas";

export type LancamentoFaturaActionState = { error?: string } | undefined;

/** Distribui `valorTotal` (reais) em `parcelas` valores, em centavos, sem
 * perda por arredondamento — as primeiras parcelas absorvem o resto. */
function distribuirEmParcelas(valorTotal: number, parcelas: number): number[] {
  const totalCents = Math.round(valorTotal * 100);
  const base = Math.floor(totalCents / parcelas);
  const resto = totalCents - base * parcelas;
  return Array.from({ length: parcelas }, (_, i) => (base + (i < resto ? 1 : 0)) / 100);
}

export async function saveLancamentoFatura(
  _prevState: LancamentoFaturaActionState,
  formData: FormData
): Promise<LancamentoFaturaActionState> {
  const faturaId = String(formData.get("fatura_id") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valorRaw = String(formData.get("valor") ?? "").trim();
  const categoriaId = String(formData.get("categoria_id") ?? "").trim();
  const subcategoriaId = String(formData.get("subcategoria_id") ?? "").trim();
  const ehParcelado = formData.get("eh_parcelado") === "on";
  const totalParcelasRaw = String(formData.get("total_parcelas") ?? "").trim();

  if (!faturaId || !descricao || !categoriaId) {
    return { error: "Preencha descrição, valor e categoria." };
  }

  const valor = Number(valorRaw.replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    return { error: "Informe um valor válido, maior que zero." };
  }

  let totalParcelas = 1;
  if (ehParcelado) {
    totalParcelas = Number(totalParcelasRaw);
    if (!Number.isInteger(totalParcelas) || totalParcelas < 2) {
      return { error: "Informe um número de parcelas válido (mínimo 2)." };
    }
  }

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

  if (!fatura) return { error: "Fatura não encontrada." };
  if (fatura.status !== "aberta") {
    return { error: "Só é possível lançar em faturas abertas." };
  }

  const basePayload = {
    descricao,
    categoria_id: categoriaId,
    subcategoria_id: subcategoriaId || null,
  };

  if (!ehParcelado) {
    const { error } = await supabase.from("lancamentos_fatura").insert({
      ...basePayload,
      fatura_id: faturaId,
      valor,
      eh_parcelado: false,
    });

    if (error) return { error: error.message };

    revalidatePath("/cartoes");
    revalidatePath(`/cartoes/${fatura.cartao_id}`);
    return;
  }

  const { data: cartao } = await supabase
    .from("cartoes")
    .select("id, dia_fechamento, dia_vencimento, conta_pagamento_padrao_id")
    .eq("id", fatura.cartao_id)
    .single();

  if (!cartao) return { error: "Cartão não encontrado." };

  let faturasDestino;
  try {
    faturasDestino = await getOrCriarProximasFaturas(supabase, cartao, totalParcelas);
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? `Falha ao preparar faturas futuras: ${e.message}`
          : "Falha ao preparar faturas futuras.",
    };
  }

  if (faturasDestino[0]?.id !== faturaId) {
    return { error: "Lance a compra parcelada a partir da fatura corrente do cartão." };
  }

  const valoresParcelas = distribuirEmParcelas(valor, totalParcelas);

  const { data: primeira, error: erroPrimeira } = await supabase
    .from("lancamentos_fatura")
    .insert({
      ...basePayload,
      fatura_id: faturasDestino[0].id,
      valor: valoresParcelas[0],
      eh_parcelado: true,
      parcela_atual: 1,
      total_parcelas: totalParcelas,
    })
    .select("id")
    .single();

  if (erroPrimeira || !primeira) {
    return { error: erroPrimeira?.message ?? "Falha ao lançar a compra parcelada." };
  }

  if (totalParcelas > 1) {
    const demaisParcelas = faturasDestino.slice(1).map((fat, idx) => ({
      ...basePayload,
      fatura_id: fat.id,
      valor: valoresParcelas[idx + 1],
      eh_parcelado: true,
      parcela_atual: idx + 2,
      total_parcelas: totalParcelas,
      compra_original_id: primeira.id,
    }));

    const { error: erroDemais } = await supabase
      .from("lancamentos_fatura")
      .insert(demaisParcelas);

    if (erroDemais) return { error: erroDemais.message };
  }

  revalidatePath("/cartoes");
  revalidatePath(`/cartoes/${fatura.cartao_id}`);
}

export async function deleteLancamentoFatura(id: string, cartaoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("lancamentos_fatura").delete().eq("id", id);

  revalidatePath("/cartoes");
  revalidatePath(`/cartoes/${cartaoId}`);
}
