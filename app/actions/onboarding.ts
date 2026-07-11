"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Nesta etapa, nenhuma fonte de receita existe ainda, então o modo
  // "ciclo" nunca está disponível — o sistema sempre força "calendario".
  await supabase
    .from("profiles")
    .update({ modo_financeiro: "calendario", onboarding_completo: true })
    .eq("id", user.id);

  redirect("/dashboard");
}
