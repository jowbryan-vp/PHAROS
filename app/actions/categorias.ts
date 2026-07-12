"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CategoriaActionState = { error?: string } | undefined;

export async function saveCategoria(
  _prevState: CategoriaActionState,
  formData: FormData
): Promise<CategoriaActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const isRecorrente = formData.get("is_recorrente") === "on";

  if (!nome) {
    return { error: "Informe um nome para a categoria." };
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
      .from("categorias")
      .update({ nome, is_recorrente: isRecorrente })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("categorias").insert({
      user_id: user.id,
      nome,
      is_recorrente: isRecorrente,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/categorias");
}

export async function deleteCategoria(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("categorias")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/categorias");
}

export type SubcategoriaActionState = { error?: string } | undefined;

export async function saveSubcategoria(
  _prevState: SubcategoriaActionState,
  formData: FormData
): Promise<SubcategoriaActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const categoriaId = String(formData.get("categoria_id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();

  if (!nome) {
    return { error: "Informe um nome para a subcategoria." };
  }
  if (!categoriaId) {
    return { error: "Categoria inválida." };
  }

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("subcategorias")
      .update({ nome })
      .eq("id", id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("subcategorias")
      .insert({ categoria_id: categoriaId, nome });

    if (error) return { error: error.message };
  }

  revalidatePath("/categorias");
}

export async function deleteSubcategoria(id: string) {
  const supabase = await createClient();
  await supabase.from("subcategorias").delete().eq("id", id);
  revalidatePath("/categorias");
}
