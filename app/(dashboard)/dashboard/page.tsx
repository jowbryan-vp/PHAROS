import { createClient } from "@/lib/supabase/server";
import { ProfileRealtimeCard } from "@/components/features/profile-realtime-card";
import { ReceitasResumoCard } from "@/components/features/receitas-resumo-card";
import {
  getPeriodoAtual,
  formatPeriodoLabel,
  getTotalRecebidoNoPeriodo,
} from "@/lib/periodo";
import {
  ensureRecorrentesDoPeriodo,
  getTotalEsperadoNoPeriodo,
} from "@/lib/recorrentes";

export default async function DashboardPage() {
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

  const periodo = await getPeriodoAtual(
    supabase,
    user!.id,
    profile?.modo_financeiro ?? null
  );

  await ensureRecorrentesDoPeriodo(supabase, user!.id, periodo);

  const periodoLabel = periodo
    ? formatPeriodoLabel(periodo)
    : "Nenhum ciclo iniciado ainda";

  const [totalRecebido, totalEsperado] = await Promise.all([
    periodo ? getTotalRecebidoNoPeriodo(supabase, user!.id, periodo) : 0,
    getTotalEsperadoNoPeriodo(supabase, user!.id, periodo),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ReceitasResumoCard
        totalRecebido={totalRecebido}
        totalEsperado={totalEsperado}
        periodoLabel={periodoLabel}
      />

      {profile && (
        <ProfileRealtimeCard
          profile={profile}
          hasPrincipalFonte={(fontesPrincipaisCount ?? 0) > 0}
        />
      )}
    </div>
  );
}
