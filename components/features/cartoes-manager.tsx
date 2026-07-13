"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteCartao } from "@/app/actions/cartoes";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { CartaoForm } from "@/components/features/cartao-form";

type Conta = { id: string; nome: string };
type Cartao = {
  id: string;
  nome: string;
  dia_fechamento: number;
  dia_vencimento: number;
  conta_pagamento_padrao_id: string | null;
  faturaAtual: { id: string; periodo_fim: string; data_vencimento: string } | null;
  valorAtual: number;
};

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function CartoesManager({
  cartoes,
  contas,
}: {
  cartoes: Cartao[];
  contas: Conta[];
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold text-foreground">
          Cartões
        </h1>
        {!creating && (
          <Button onClick={() => setCreating(true)}>Novo cartão</Button>
        )}
      </div>

      {creating && (
        <CartaoForm contas={contas} onDone={() => setCreating(false)} />
      )}

      {cartoes.length === 0 && !creating && (
        <EmptyState
          title="Nenhum cartão ainda"
          description="Cadastre um cartão de crédito para começar a acompanhar suas faturas."
          action={<Button onClick={() => setCreating(true)}>Criar o primeiro</Button>}
        />
      )}

      <ul className="flex flex-col gap-3">
        {cartoes.map((cartao) =>
          editingId === cartao.id ? (
            <li key={cartao.id}>
              <CartaoForm
                cartao={cartao}
                contas={contas}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={cartao.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Link href={`/cartoes/${cartao.id}`} className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {cartao.nome}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    fecha dia {cartao.dia_fechamento} · vence dia{" "}
                    {cartao.dia_vencimento}
                  </span>
                </div>
                {cartao.faturaAtual && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Fatura atual: {formatBRL(cartao.valorAtual)} · vence em{" "}
                    {formatDateBR(cartao.faturaAtual.data_vencimento)}
                  </p>
                )}
              </Link>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditingId(cartao.id)}
                  className="text-sm text-brand hover:underline"
                >
                  Editar
                </button>
                <DeleteButton
                  id={cartao.id}
                  action={deleteCartao}
                  confirmMessage={`Excluir o cartão "${cartao.nome}"? Todas as faturas e lançamentos serão excluídos.`}
                />
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
