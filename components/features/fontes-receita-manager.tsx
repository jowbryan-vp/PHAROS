"use client";

import { useState } from "react";
import { deleteFonteReceita } from "@/app/actions/fontes-receita";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { FonteReceitaForm } from "@/components/features/fonte-receita-form";

type FonteReceita = {
  id: string;
  nome: string;
  is_principal: boolean;
  tributavel_padrao: boolean;
  is_recorrente: boolean;
  valor_esperado: number | null;
  dia_esperado: number | null;
};

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FontesReceitaManager({
  fontes,
}: {
  fontes: FonteReceita[];
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold text-foreground">
          Fontes de receita
        </h1>
        {!creating && (
          <Button onClick={() => setCreating(true)}>Nova fonte</Button>
        )}
      </div>

      {creating && (
        <FonteReceitaForm onDone={() => setCreating(false)} />
      )}

      {fontes.length === 0 && !creating && (
        <EmptyState
          title="Nenhuma fonte de receita ainda"
          description="Cadastre de onde vem o seu dinheiro — salário, freelance, aluguel recebido, etc."
          action={<Button onClick={() => setCreating(true)}>Criar a primeira</Button>}
        />
      )}

      <ul className="flex flex-col gap-3">
        {fontes.map((fonte) =>
          editingId === fonte.id ? (
            <li key={fonte.id}>
              <FonteReceitaForm
                fonte={fonte}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={fonte.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {fonte.nome}
                  </span>
                  {fonte.is_principal && (
                    <span className="rounded-full bg-cta/15 px-2 py-0.5 text-xs font-medium text-cta-foreground">
                      Principal
                    </span>
                  )}
                  {fonte.is_recorrente && (
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                      Recorrente
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {fonte.tributavel_padrao
                    ? "Tributável por padrão"
                    : "Não tributável por padrão"}
                  {fonte.is_recorrente &&
                    fonte.valor_esperado &&
                    fonte.dia_esperado &&
                    ` · ${formatBRL(fonte.valor_esperado)} esperado todo dia ${fonte.dia_esperado}`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditingId(fonte.id)}
                  className="text-sm text-brand hover:underline"
                >
                  Editar
                </button>
                <DeleteButton
                  id={fonte.id}
                  action={deleteFonteReceita}
                  confirmMessage={`Excluir a fonte de receita "${fonte.nome}"?`}
                />
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
