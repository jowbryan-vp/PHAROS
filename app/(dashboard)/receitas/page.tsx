import { createClient } from "@/lib/supabase/server";
import { ReceitasManager } from "@/components/features/receitas-manager";
import { resolvePeriodoView, getProjecaoRecorrentes } from "@/lib/periodo-navegacao";
import { ensureRecorrentesDoPeriodo, getPendentesDoPeriodo } from "@/lib/recorrentes";

export default async function ReceitasLancamentosPage({
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

  const [fontesRes, contasRes] = await Promise.all([
    supabase
      .from("fontes_receita")
      .select("id, nome, tributavel_padrao")
      .eq("user_id", user!.id)
      .order("criado_em", { ascending: true }),
    supabase
      .from("contas")
      .select("id, nome")
      .eq("user_id", user!.id)
      .order("criado_em", { ascending: true }),
  ]);

  if (!periodoView) {
    return (
      <ReceitasManager
        receitas={[]}
        fontes={fontesRes.data ?? []}
        contas={contasRes.data ?? []}
        periodoLabel="Nenhum ciclo iniciado ainda — o primeiro lançamento da fonte principal vai abrir o ciclo."
        periodoNav={null}
        pendentes={[]}
        pendentesConfirmaveis={false}
        totalRecebido={0}
        totalEsperado={0}
      />
    );
  }

  if (periodoView.isAtual) {
    await ensureRecorrentesDoPeriodo(supabase, user!.id, periodoView);
  }

  let receitas: Array<{
    id: string;
    fonte_receita_id: string;
    conta_id: string;
    valor: number;
    data_recebimento: string;
    tributavel: boolean;
    observacao: string | null;
    fontes_receita: { nome: string } | null;
    contas: { nome: string } | null;
  }> = [];

  let pendentes: Array<{
    id: string;
    fonte_receita_id: string;
    valor_esperado: number;
    nome_fonte: string;
    dataSugerida: string | null;
  }> = [];

  if (!periodoView.isProjetado) {
    let receitasQuery = supabase
      .from("receitas")
      .select(
        "id, fonte_receita_id, conta_id, valor, data_recebimento, tributavel, observacao, fontes_receita(nome), contas(nome)"
      )
      .eq("user_id", user!.id)
      .gte("data_recebimento", periodoView.dataInicio);

    if (periodoView.dataFim) {
      receitasQuery = receitasQuery.lte("data_recebimento", periodoView.dataFim);
    }

    const { data } = await receitasQuery
      .order("data_recebimento", { ascending: false })
      .order("criado_em", { ascending: false });

    receitas = data ?? [];

    if (periodoView.isAtual) {
      pendentes = await getPendentesDoPeriodo(supabase, user!.id, periodoView);
    }
  } else {
    const reais = await getPendentesDoPeriodo(supabase, user!.id, periodoView);
    if (reais.length > 0) {
      pendentes = reais;
    } else {
      const projecao = await getProjecaoRecorrentes(
        supabase,
        user!.id,
        periodoView.dataInicio
      );
      pendentes = projecao.map((proj, i) => ({
        id: `projecao-${i}`,
        fonte_receita_id: proj.fonteReceitaId,
        valor_esperado: proj.valorEsperado,
        nome_fonte: proj.nomeFonte,
        dataSugerida: proj.dataSugerida,
      }));
    }
  }

  const totalRecebido = receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalEsperado = pendentes.reduce((sum, p) => sum + p.valor_esperado, 0);

  return (
    <ReceitasManager
      receitas={receitas}
      fontes={fontesRes.data ?? []}
      contas={contasRes.data ?? []}
      periodoLabel={periodoView.label}
      periodoNav={{
        prevHref: periodoView.prevHref,
        nextHref: periodoView.nextHref,
        isProjetado: periodoView.isProjetado,
        isAtual: periodoView.isAtual,
      }}
      pendentes={pendentes}
      pendentesConfirmaveis={periodoView.isAtual}
      totalRecebido={totalRecebido}
      totalEsperado={totalEsperado}
    />
  );
}
