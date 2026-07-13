import { createClient } from "@/lib/supabase/server";
import { ensureFaturasAtualizadas, getValorTotalFatura } from "@/lib/faturas";
import { CartoesManager } from "@/components/features/cartoes-manager";

export default async function CartoesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await ensureFaturasAtualizadas(supabase, user!.id);

  const { data: cartoes } = await supabase
    .from("cartoes")
    .select("id, nome, dia_fechamento, dia_vencimento, conta_pagamento_padrao_id")
    .eq("user_id", user!.id)
    .order("criado_em", { ascending: true });

  const { data: contas } = await supabase
    .from("contas")
    .select("id, nome")
    .eq("user_id", user!.id)
    .order("criado_em", { ascending: true });

  const cartoesComFatura = await Promise.all(
    (cartoes ?? []).map(async (cartao) => {
      const { data: faturaAtual } = await supabase
        .from("faturas")
        .select("id, periodo_fim, data_vencimento")
        .eq("cartao_id", cartao.id)
        .eq("status", "aberta")
        .order("periodo_fim", { ascending: true })
        .limit(1)
        .maybeSingle();

      const valorAtual = faturaAtual
        ? await getValorTotalFatura(supabase, faturaAtual.id)
        : 0;

      return { ...cartao, faturaAtual, valorAtual };
    })
  );

  return <CartoesManager cartoes={cartoesComFatura} contas={contas ?? []} />;
}
