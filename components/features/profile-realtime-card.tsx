"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Profile = {
  id: string;
  nome: string | null;
  modo_financeiro: string | null;
  onboarding_completo: boolean;
};

export function ProfileRealtimeCard({
  profile,
  hasPrincipalFonte,
}: {
  profile: Profile;
  hasPrincipalFonte: boolean;
}) {
  const [current, setCurrent] = useState(profile);
  const [nomeInput, setNomeInput] = useState(profile.nome ?? "");
  const [saving, setSaving] = useState(false);
  const [savingModo, setSavingModo] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`profiles-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          const next = payload.new as Profile;
          setCurrent(next);
          setNomeInput(next.nome ?? "");
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ nome: nomeInput })
      .eq("id", profile.id);
    setSaving(false);
  }

  async function handleModoChange(modo: "calendario" | "ciclo") {
    if (modo === "ciclo" && !hasPrincipalFonte) return;
    setSavingModo(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ modo_financeiro: modo })
      .eq("id", profile.id);
    setSavingModo(false);
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Seu perfil
        </h2>
        <span
          className={`flex items-center gap-1.5 text-xs ${
            connected ? "text-success" : "text-neutral-400 dark:text-neutral-600"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-success" : "bg-neutral-300 dark:bg-neutral-700"
            }`}
          />
          {connected ? "Realtime conectado" : "Conectando..."}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            value={nomeInput}
            onChange={(e) => setNomeInput(e.target.value)}
            placeholder="Seu nome"
          />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Altere seu nome aqui e abra o dashboard em outra aba (ou
          dispositivo) logado na mesma conta: a mudança deve aparecer sem
          recarregar a página.
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm tabular-nums-feature">
          <dt className="text-neutral-500 dark:text-neutral-400">Onboarding completo</dt>
          <dd className="text-neutral-900 dark:text-neutral-100">
            {current.onboarding_completo ? "Sim" : "Não"}
          </dd>
        </dl>

        <div className="mt-1">
          <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Modo financeiro
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={savingModo}
              onClick={() => handleModoChange("calendario")}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                current.modo_financeiro === "calendario"
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              Calendário
            </button>
            <button
              type="button"
              disabled={savingModo || !hasPrincipalFonte}
              onClick={() => handleModoChange("ciclo")}
              title={
                hasPrincipalFonte
                  ? undefined
                  : "Disponível quando você marcar uma fonte de receita como principal (em Fontes de receita)."
              }
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                current.modo_financeiro === "ciclo"
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              Ciclo
            </button>
          </div>
          {!hasPrincipalFonte && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              O modo Ciclo libera quando você marcar uma fonte de receita
              como principal.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
