import { createClient } from "@/lib/supabase/server";
import { resolvePeriodoView } from "@/lib/periodo-navegacao";
import {
  ensureGastosFixosDoPeriodo,
  getLancamentosDoPeriodo,
  getProjecaoGastosFixos,
  type LancamentoGastoFixo,
  type ProjecaoGastoFixo,
} from "@/lib/gastos-fixos";
import { GastosFixosManager } from "@/components/features/gastos-fixos-manager";
import { PeriodoSync } from "@/components/features/periodo-sync";

export default async function GastosFixosPage({
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

  const [gastosRes, categoriasRes, contasRes] = await Promise.all([
    supabase
      .from("gastos_fixos")
      .select(
        "id, nome, valor, dia_vencimento, categoria_id, conta_pagamento_padrao_id, ativo, categorias(nome)"
      )
      .eq("user_id", user!.id)
      .order("criado_em", { ascending: true }),
    supabase
      .from("categorias")
      .select("id, nome")
      .eq("user_id", user!.id)
      .order("criado_em", { ascending: true }),
    supabase
      .from("contas")
      .select("id, nome")
      .eq("user_id", user!.id)
      .order("criado_em", { ascending: true }),
  ]);

  let lancamentos: LancamentoGastoFixo[] = [];
  let projecao: ProjecaoGastoFixo[] = [];

  if (periodoView) {
    if (periodoView.isAtual) {
      await ensureGastosFixosDoPeriodo(supabase, user!.id, periodoView);
    }

    if (!periodoView.isProjetado) {
      lancamentos = await getLancamentosDoPeriodo(supabase, user!.id, periodoView);
    } else {
      const reais = await getLancamentosDoPeriodo(supabase, user!.id, periodoView);
      if (reais.length > 0) {
        lancamentos = reais;
      } else {
        projecao = await getProjecaoGastosFixos(supabase, user!.id);
      }
    }
  }

  return (
    <>
      <PeriodoSync p={p ?? null} />
      <GastosFixosManager
        gastosFixos={gastosRes.data ?? []}
        categorias={categoriasRes.data ?? []}
        contas={contasRes.data ?? []}
        periodoLabel={periodoView?.label ?? "Nenhum ciclo iniciado ainda"}
        periodoNav={
          periodoView
            ? {
                prevHref: periodoView.prevHref,
                nextHref: periodoView.nextHref,
                isProjetado: periodoView.isProjetado,
                isAtual: periodoView.isAtual,
              }
            : null
        }
        lancamentos={lancamentos}
        projecao={projecao}
      />
    </>
  );
}
