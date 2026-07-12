"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FonteReceitaActionState = { error?: string } | undefined;

export async function saveFonteReceita(
  _prevState: FonteReceitaActionState,
  formData: FormData
): Promise<FonteReceitaActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const isPrincipal = formData.get("is_principal") === "on";
  const tributavelPadrao = formData.get("tributavel_padrao") === "on";

  if (!nome) {
    return { error: "Informe um nome para a fonte de receita." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  if (id) {
    const { error } = await supabase
      .from("fontes_receita")
      .update({
        nome,
        is_principal: isPrincipal,
        tributavel_padrao: tributavelPadrao,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("fontes_receita").insert({
      user_id: user.id,
      nome,
      is_principal: isPrincipal,
      tributavel_padrao: tributavelPadrao,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/receitas");
}

export async function deleteFonteReceita(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("fontes_receita")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/receitas");
}
