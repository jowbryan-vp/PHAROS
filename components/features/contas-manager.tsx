"use client";

import { useState } from "react";
import { deleteConta } from "@/app/actions/contas";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { ContaForm } from "@/components/features/conta-form";

type Conta = { id: string; nome: string };

export function ContasManager({ contas }: { contas: Conta[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold text-foreground">
          Contas
        </h1>
        {!creating && (
          <Button onClick={() => setCreating(true)}>Nova conta</Button>
        )}
      </div>

      {creating && <ContaForm onDone={() => setCreating(false)} />}

      {contas.length === 0 && !creating && (
        <EmptyState
          title="Nenhuma conta ainda"
          description="Cadastre suas contas bancárias, carteiras digitais ou dinheiro em espécie."
          action={<Button onClick={() => setCreating(true)}>Criar a primeira</Button>}
        />
      )}

      <ul className="flex flex-col gap-3">
        {contas.map((conta) =>
          editingId === conta.id ? (
            <li key={conta.id}>
              <ContaForm conta={conta} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li
              key={conta.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {conta.nome}
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Saldo: disponível a partir da Etapa 3
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditingId(conta.id)}
                  className="text-sm text-brand hover:underline"
                >
                  Editar
                </button>
                <DeleteButton
                  id={conta.id}
                  action={deleteConta}
                  confirmMessage={`Excluir a conta "${conta.nome}"?`}
                />
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
