import { createClient } from "@/lib/supabase/server";
import { PeriodoSync } from "@/components/features/periodo-sync";
import { DashboardPeriodoNav } from "@/components/features/dashboard-periodo-nav";
import { DashboardCard, DashboardSection } from "@/components/features/dashboard-card";
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
import { ensureFaturasAtualizadas, getResumoFaturasDoPeriodo } from "@/lib/faturas";
import { getResumoContribuicaoDoPeriodo } from "@/lib/contribuicoes";

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("modo_financeiro")
    .eq("id", user!.id)
    .single();

  const periodoView = await resolvePeriodoView(
    supabase,
    user!.id,
    profile?.modo_financeiro ?? null,
    p
  );

  await ensureFaturasAtualizadas(supabase, user!.id);

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

  const resumoFaturas = await getResumoFaturasDoPeriodo(supabase, user!.id, periodoView);
  const resumoContribuicao = await getResumoContribuicaoDoPeriodo(
    supabase,
    user!.id,
    periodoView
  );

  return (
    <div className="flex flex-col gap-6">
      <PeriodoSync p={p ?? null} />
      <DashboardPeriodoNav
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

      <DashboardSection title="Receitas">
        <DashboardCard label="Recebido no período" value={formatBRL(totalRecebido)} />
        <DashboardCard
          label="Esperado (pendente)"
          value={formatBRL(totalEsperado)}
          tone="highlight"
        />
      </DashboardSection>

      <DashboardSection title="Cartões">
        <DashboardCard
          label="Faturas em aberto"
          value={formatBRL(resumoFaturas.totalAberto)}
        />
        <DashboardCard
          label="Faturas a pagar"
          value={formatBRL(resumoFaturas.totalAPagar)}
          tone="highlight"
        />
        <DashboardCard
          label="Faturas pagas no período"
          value={formatBRL(resumoFaturas.totalPago)}
        />
      </DashboardSection>

      <DashboardSection title="Gastos Fixos">
        <DashboardCard
          label="Fixos pendentes"
          value={formatBRL(totalGastosPendente)}
          tone="highlight"
        />
        <DashboardCard label="Fixos pagos" value={formatBRL(totalGastosPago)} />
      </DashboardSection>

      <DashboardSection title="Contribuição">
        <DashboardCard
          label="Contribuição comprometida"
          value={formatBRL(resumoContribuicao.totalComprometido)}
          tone="highlight"
        />
        <DashboardCard
          label="Contribuição paga"
          value={formatBRL(resumoContribuicao.totalPago)}
        />
      </DashboardSection>

      {/*
        Etapa 7 (Cofrinhos): nova <DashboardSection title="Cofrinhos"> entra
        aqui.
        Etapa 9 (Motor de Previsão): card de Saldo Projetado — provavelmente
        um destaque no topo da grade, acima de "Receitas", já que consolida
        as seções abaixo.
      */}
    </div>
  );
}
