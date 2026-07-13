"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { criarFaturaInicial } from "@/lib/faturas";

export type CartaoActionState = { error?: string } | undefined;

export async function saveCartao(
  _prevState: CartaoActionState,
  formData: FormData
): Promise<CartaoActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const diaFechamentoRaw = String(formData.get("dia_fechamento") ?? "").trim();
  const diaVencimentoRaw = String(formData.get("dia_vencimento") ?? "").trim();
  const contaPagamentoPadraoId = String(
    formData.get("conta_pagamento_padrao_id") ?? ""
  ).trim();

  if (!nome) {
    return { error: "Informe um nome para o cartão." };
  }

  const diaFechamento = Number(diaFechamentoRaw);
  const diaVencimento = Number(diaVencimentoRaw);

  if (
    !Number.isInteger(diaFechamento) ||
    diaFechamento < 1 ||
    diaFechamento > 31
  ) {
    return { error: "Informe um dia de fechamento válido (1 a 31)." };
  }

  if (
    !Number.isInteger(diaVencimento) ||
    diaVencimento < 1 ||
    diaVencimento > 31
  ) {
    return { error: "Informe um dia de vencimento válido (1 a 31)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const payload = {
    nome,
    dia_fechamento: diaFechamento,
    dia_vencimento: diaVencimento,
    conta_pagamento_padrao_id: contaPagamentoPadraoId || null,
  };

  if (id) {
    const { error } = await supabase
      .from("cartoes")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  } else {
    const { data: novoCartao, error } = await supabase
      .from("cartoes")
      .insert({ ...payload, user_id: user.id })
      .select()
      .single();

    if (error) return { error: error.message };

    if (novoCartao) {
      try {
        await criarFaturaInicial(supabase, novoCartao);
      } catch (e) {
        return {
          error:
            e instanceof Error
              ? `Cartão criado, mas houve um erro ao gerar a fatura inicial: ${e.message}`
              : "Cartão criado, mas houve um erro ao gerar a fatura inicial.",
        };
      }
    }
  }

  revalidatePath("/cartoes");
}

export async function deleteCartao(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("cartoes").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/cartoes");
}
