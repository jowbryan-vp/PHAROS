import { createClient } from "@/lib/supabase/server";
import { ProfileRealtimeCard } from "@/components/features/profile-realtime-card";
import { ReceitasResumoCard } from "@/components/features/receitas-resumo-card";
import { GastosFixosResumoCard } from "@/components/features/gastos-fixos-resumo-card";
import { getTotalRecebidoNoPeriodo } from "@/lib/periodo";
import { resolvePeriodoView, getProjecaoRecorrentes } from "@/lib/periodo-navegacao";
import {
  ensureRecorrentesDoPeriodo,
  getTotalEsperadoNoPeriodo,
  getPendentesDoPeriodo,
} from "@/lib/recorrentes";
import {
  ensureGastosFixosDoPeriodo,
  getResumoDoPeriodo,
  getProjecaoGastosFixos,
} from "@/lib/gastos-fixos";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
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

  const periodoView = await resolvePeriodoView(
    supabase,
    user!.id,
    profile?.modo_financeiro ?? null,
    p
  );

  let totalRecebido = 0;
  let totalEsperado = 0;
  let totalGastosPendente = 0;
  let totalGastosPago = 0;
  const periodoLabel = periodoView?.label ?? "Nenhum ciclo iniciado ainda";

  if (periodoView) {
    if (periodoView.isAtual) {
      await ensureRecorrentesDoPeriodo(supabase, user!.id, periodoView);
      await ensureGastosFixosDoPeriodo(supabase, user!.id, periodoView);
    }

    if (!periodoView.isProjetado) {
      totalRecebido = await getTotalRecebidoNoPeriodo(
        supabase,
        user!.id,
        periodoView
      );
      totalEsperado = periodoView.isAtual
        ? await getTotalEsperadoNoPeriodo(supabase, user!.id, periodoView)
        : 0;

      const resumoGastos = await getResumoDoPeriodo(supabase, user!.id, periodoView);
      totalGastosPendente = resumoGastos.totalPendente;
      totalGastosPago = resumoGastos.totalPago;
    } else {
      const reais = await getPendentesDoPeriodo(supabase, user!.id, periodoView);
      if (reais.length > 0) {
        totalEsperado = reais.reduce((sum, r) => sum + r.valor_esperado, 0);
      } else {
        const projecao = await getProjecaoRecorrentes(
          supabase,
          user!.id,
          periodoView.dataInicio
        );
        totalEsperado = projecao.reduce((sum, r) => sum + r.valorEsperado, 0);
      }

      const resumoGastosReais = await getResumoDoPeriodo(supabase, user!.id, periodoView);
      if (resumoGastosReais.totalPendente > 0 || resumoGastosReais.totalPago > 0) {
        totalGastosPendente = resumoGastosReais.totalPendente;
        totalGastosPago = resumoGastosReais.totalPago;
      } else {
        const projecaoGastos = await getProjecaoGastosFixos(supabase, user!.id);
        totalGastosPendente = projecaoGastos.reduce((sum, g) => sum + g.valor, 0);
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ReceitasResumoCard
        totalRecebido={totalRecebido}
        totalEsperado={totalEsperado}
        periodoLabel={periodoLabel}
        periodoNav={
          periodoView
            ? {
                prevHref: periodoView.prevHref,
                nextHref: periodoView.nextHref,
                isProjetado: periodoView.isProjetado,
              }
            : null
        }
      />

      {periodoView && (
        <GastosFixosResumoCard
          totalPendente={totalGastosPendente}
          totalPago={totalGastosPago}
          isProjetado={periodoView.isProjetado}
        />
      )}

      {profile && (
        <ProfileRealtimeCard
          profile={profile}
          hasPrincipalFonte={(fontesPrincipaisCount ?? 0) > 0}
        />
      )}
    </div>
  );
}
