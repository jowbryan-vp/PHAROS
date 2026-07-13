import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureFaturasAtualizadas } from "@/lib/faturas";
import { CartaoDetalhe } from "@/components/features/cartao-detalhe";

export default async function CartaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await ensureFaturasAtualizadas(supabase, user!.id);

  const { data: cartao } = await supabase
    .from("cartoes")
    .select("id, nome, dia_fechamento, dia_vencimento, conta_pagamento_padrao_id")
    .eq("id", id)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!cartao) notFound();

  const [faturasRes, categoriasRes, contasRes] = await Promise.all([
    supabase
      .from("faturas")
      .select(
        "id, periodo_inicio, periodo_fim, data_vencimento, status, conta_pagamento_id, lancamentos_fatura(id, descricao, valor, eh_parcelado, parcela_atual, total_parcelas, categorias(nome), subcategorias(nome))"
      )
      .eq("cartao_id", cartao.id)
      .order("periodo_fim", { ascending: true }),
    supabase
      .from("categorias")
      .select("id, nome, subcategorias(id, nome)")
      .eq("user_id", user!.id)
      .order("criado_em", { ascending: true }),
    supabase
      .from("contas")
      .select("id, nome")
      .eq("user_id", user!.id)
      .order("criado_em", { ascending: true }),
  ]);

  const faturas = faturasRes.data ?? [];
  const faturaAtual = faturas.find((f) => f.status === "aberta") ?? null;
  const futuras = faturas.filter(
    (f) => f.status === "aberta" && f.id !== faturaAtual?.id
  );
  const fechadas = faturas.filter((f) => f.status === "fechada");
  const pagas = faturas.filter((f) => f.status === "paga");

  return (
    <CartaoDetalhe
      cartao={cartao}
      faturaAtual={faturaAtual}
      futuras={futuras}
      fechadas={fechadas}
      pagas={pagas}
      categorias={categoriasRes.data ?? []}
      contas={contasRes.data ?? []}
    />
  );
}
