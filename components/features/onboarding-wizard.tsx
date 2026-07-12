"use client";

import { useState } from "react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";

type Step = "boas-vindas" | "modo-financeiro";

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>("boas-vindas");

  return (
    <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {step === "boas-vindas" && (
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-lg font-semibold text-foreground">
            Bem-vindo(a) ao PHAROS
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Este é um novo começo: não existe nenhum dado pré-cadastrado.
            Fontes de receita, contas, categorias e tudo o mais serão criados
            por você, passo a passo, nas próximas etapas.
          </p>
          <Button onClick={() => setStep("modo-financeiro")}>Continuar</Button>
        </div>
      )}

      {step === "modo-financeiro" && (
        <form action={completeOnboarding} className="flex flex-col gap-4">
          <h1 className="font-display text-lg font-semibold text-foreground">
            Modo financeiro
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Escolha como o PHAROS deve organizar seus períodos financeiros.
          </p>

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-brand bg-brand/5 p-3">
            <input
              type="radio"
              name="modo_financeiro"
              value="calendario"
              defaultChecked
              readOnly
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Calendário
              </span>
              <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                Organiza suas finanças pelo mês do calendário civil.
              </span>
            </span>
          </label>

          <label className="flex cursor-not-allowed items-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 opacity-60 dark:border-neutral-800 dark:bg-neutral-800">
            <input type="radio" name="modo_financeiro_disabled" disabled className="mt-1" />
            <span>
              <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Ciclo
              </span>
              <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                Disponível somente após você cadastrar uma fonte de receita
                marcada como principal (Etapa 3 — Receitas).
              </span>
            </span>
          </label>

          <Button type="submit">Concluir e ir para o dashboard</Button>
        </form>
      )}
    </div>
  );
}
