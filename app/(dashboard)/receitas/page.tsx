import { createClient } from "@/lib/supabase/server";
import { FontesReceitaManager } from "@/components/features/fontes-receita-manager";

export default async function ReceitasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: fontes } = await supabase
    .from("fontes_receita")
    .select("id, nome, is_principal, tributavel_padrao")
    .eq("user_id", user!.id)
    .order("criado_em", { ascending: true });

  return <FontesReceitaManager fontes={fontes ?? []} />;
}
