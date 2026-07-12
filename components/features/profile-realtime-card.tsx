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

export function ProfileRealtimeCard({ profile }: { profile: Profile }) {
  const [current, setCurrent] = useState(profile);
  const [nomeInput, setNomeInput] = useState(profile.nome ?? "");
  const [saving, setSaving] = useState(false);
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
          <dt className="text-neutral-500 dark:text-neutral-400">Modo financeiro</dt>
          <dd className="text-neutral-900 dark:text-neutral-100">
            {current.modo_financeiro}
          </dd>
          <dt className="text-neutral-500 dark:text-neutral-400">Onboarding completo</dt>
          <dd className="text-neutral-900 dark:text-neutral-100">
            {current.onboarding_completo ? "Sim" : "Não"}
          </dd>
        </dl>
      </div>
    </div>
  );
}
