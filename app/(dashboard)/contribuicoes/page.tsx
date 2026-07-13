import { createClient } from "@/lib/supabase/server";
import { resolvePeriodoView } from "@/lib/periodo-navegacao";
import { getContribuicoesDoPeriodo } from "@/lib/contribuicoes";
import { ContribuicoesManager } from "@/components/features/contribuicoes-manager";
import { PeriodoSync } from "@/components/features/periodo-sync";

export default async function ContribuicoesPage({
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

  const { data: contas } = await supabase
    .from("contas")
    .select("id, nome")
    .eq("user_id", user!.id)
    .order("criado_em", { ascending: true });

  const contribuicoes = periodoView
    ? await getContribuicoesDoPeriodo(supabase, user!.id, periodoView)
    : [];

  return (
    <>
      <PeriodoSync p={p ?? null} />
      <ContribuicoesManager
        contribuicoes={contribuicoes}
        contas={contas ?? []}
        periodoLabel={periodoView?.label ?? "Nenhum ciclo iniciado ainda"}
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
    </>
  );
}
