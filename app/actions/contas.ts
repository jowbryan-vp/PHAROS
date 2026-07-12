"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ContaActionState = { error?: string } | undefined;

export async function saveConta(
  _prevState: ContaActionState,
  formData: FormData
): Promise<ContaActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();

  if (!nome) {
    return { error: "Informe um nome para a conta." };
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
      .from("contas")
      .update({ nome })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("contas")
      .insert({ user_id: user.id, nome });

    if (error) return { error: error.message };
  }

  revalidatePath("/contas");
}

export async function deleteConta(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("contas").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/contas");
}
