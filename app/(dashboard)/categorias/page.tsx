import { createClient } from "@/lib/supabase/server";
import { CategoriasManager } from "@/components/features/categorias-manager";

export default async function CategoriasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nome, is_recorrente, subcategorias(id, nome)")
    .eq("user_id", user!.id)
    .order("criado_em", { ascending: true })
    .order("criado_em", { foreignTable: "subcategorias", ascending: true });

  return <CategoriasManager categorias={categorias ?? []} />;
}
