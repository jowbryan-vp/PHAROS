import { createClient } from "@/lib/supabase/server";
import { ProfileRealtimeCard } from "@/components/features/profile-realtime-card";

export default async function PerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { count: fontesPrincipaisCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, nome, modo_financeiro, onboarding_completo")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("fontes_receita")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_principal", true),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-lg font-semibold text-foreground">Perfil</h1>
      {profile && (
        <ProfileRealtimeCard
          profile={profile}
          hasPrincipalFonte={(fontesPrincipaisCount ?? 0) > 0}
        />
      )}
    </div>
  );
}
