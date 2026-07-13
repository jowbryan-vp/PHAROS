"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ContribuicaoActionState = { error?: string } | undefined;

/** Ajusta o valor_final enquanto a contribuição está comprometida (pendente). */
export async function editarValorFinal(
  _prevState: ContribuicaoActionState,
  formData: FormData
): Promise<ContribuicaoActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const valorRaw = String(formData.get("valor_final") ?? "").trim();

  if (!id) return { error: "Contribuição não encontrada." };

  const valorFinal = Number(valorRaw.replace(",", "."));
  if (!Number.isFinite(valorFinal) || valorFinal <= 0) {
    return { error: "Informe um valor válido, maior que zero." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase
    .from("contribuicoes")
    .update({ valor_final: valorFinal })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "comprometido");

  if (error) return { error: error.message };

  revalidatePath("/contribuicoes");
  revalidatePath("/dashboard");
}

export async function marcarComoPaga(
  _prevState: ContribuicaoActionState,
  formData: FormData
): Promise<ContribuicaoActionState> {
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
    .from("contribuicoes")
    .update({
      status: "pago",
      conta_pagamento_id: contaPagamentoId,
      data_pagamento: dataPagamento,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "comprometido");

  if (error) return { error: error.message };

  revalidatePath("/contribuicoes");
  revalidatePath("/dashboard");
}
