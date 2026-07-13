"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GastoFixoActionState = { error?: string } | undefined;

export async function saveGastoFixo(
  _prevState: GastoFixoActionState,
  formData: FormData
): Promise<GastoFixoActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const valorRaw = String(formData.get("valor") ?? "").trim();
  const diaVencimentoRaw = String(formData.get("dia_vencimento") ?? "").trim();
  const categoriaId = String(formData.get("categoria_id") ?? "").trim();
  const contaPagamentoPadraoId = String(
    formData.get("conta_pagamento_padrao_id") ?? ""
  ).trim();
  const ativo = formData.get("ativo") === "on";

  if (!nome || !categoriaId) {
    return { error: "Preencha nome, valor e categoria." };
  }

  const valor = Number(valorRaw.replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    return { error: "Informe um valor válido, maior que zero." };
  }

  const diaVencimento = Number(diaVencimentoRaw);
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
    return { error: "Informe um dia de vencimento válido (1 a 31)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const payload = {
    nome,
    valor,
    dia_vencimento: diaVencimento,
    categoria_id: categoriaId,
    conta_pagamento_padrao_id: contaPagamentoPadraoId || null,
    ativo,
  };

  if (id) {
    const { error } = await supabase
      .from("gastos_fixos")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("gastos_fixos")
      .insert({ ...payload, user_id: user.id });

    if (error) return { error: error.message };
  }

  revalidatePath("/gastos-fixos");
  revalidatePath("/dashboard");
}

export async function toggleAtivoGastoFixo(id: string, ativo: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("gastos_fixos")
    .update({ ativo })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/gastos-fixos");
  revalidatePath("/dashboard");
}

export async function deleteGastoFixo(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("gastos_fixos").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/gastos-fixos");
  revalidatePath("/dashboard");
}
