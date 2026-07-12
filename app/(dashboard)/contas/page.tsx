import { createClient } from "@/lib/supabase/server";
import { ContasManager } from "@/components/features/contas-manager";

export default async function ContasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contas } = await supabase
    .from("contas")
    .select("id, nome")
    .eq("user_id", user!.id)
    .order("criado_em", { ascending: true });

  return <ContasManager contas={contas ?? []} />;
}
