"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GastoFixoLancamentoActionState = { error?: string } | undefined;

/** Ajuste pontual do valor de um lançamento específico — não altera o cadastro base. */
export async function editarValorLancamento(
  _prevState: GastoFixoLancamentoActionState,
  formData: FormData
): Promise<GastoFixoLancamentoActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const valorRaw = String(formData.get("valor") ?? "").trim();

  if (!id) return { error: "Lançamento não encontrado." };

  const valor = Number(valorRaw.replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    return { error: "Informe um valor válido, maior que zero." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase
    .from("gastos_fixos_lancamentos")
    .update({ valor })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pendente");

  if (error) return { error: error.message };

  revalidatePath("/gastos-fixos");
  revalidatePath("/dashboard");
}

export async function marcarComoPago(
  _prevState: GastoFixoLancamentoActionState,
  formData: FormData
): Promise<GastoFixoLancamentoActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const contaPagamentoId = String(formData.get("conta_pagamento_id") ?? "").trim();
  const dataPagamento = String(formData.get("data_pagamento") ?? "").trim();

  if (!id || !contaPagamentoId || !dataPagamento) {
    return { error: "Selecione a conta e a data de pagamento." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase
    .from("gastos_fixos_lancamentos")
    .update({
      status: "pago",
      conta_pagamento_id: contaPagamentoId,
      data_pagamento: dataPagamento,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pendente");

  if (error) return { error: error.message };

  revalidatePath("/gastos-fixos");
  revalidatePath("/dashboard");
}
