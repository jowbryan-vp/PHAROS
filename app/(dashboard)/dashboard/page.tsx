import { createClient } from "@/lib/supabase/server";
import { ProfileRealtimeCard } from "@/components/features/profile-realtime-card";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, modo_financeiro, onboarding_completo")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
        <h1 className="text-lg font-semibold text-neutral-900">
          Em construção
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          As funcionalidades financeiras (receitas, contas, cartões,
          cofrinhos, ciclo financeiro) chegam nas próximas etapas.
        </p>
      </div>

      {profile && <ProfileRealtimeCard profile={profile} />}
    </div>
  );
}
