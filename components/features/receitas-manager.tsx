"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteReceita } from "@/app/actions/receitas";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { ReceitaForm } from "@/components/features/receita-form";

type FonteReceita = { id: string; nome: string; tributavel_padrao: boolean };
type Conta = { id: string; nome: string };
type Receita = {
  id: string;
  fonte_receita_id: string;
  conta_id: string;
  valor: number;
  data_recebimento: string;
  tributavel: boolean;
  observacao: string | null;
  fontes_receita: { nome: string } | null;
  contas: { nome: string } | null;
};
type Pendente = {
  id: string;
  fonte_receita_id: string;
  valor_esperado: number;
  nome_fonte: string;
  dataSugerida: string | null;
};

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function ReceitasManager({
  receitas,
  fontes,
  contas,
  periodoLabel,
  pendentes,
  totalEsperado,
}: {
  receitas: Receita[];
  fontes: FonteReceita[];
  contas: Conta[];
  periodoLabel: string;
  pendentes: Pendente[];
  totalEsperado: number;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const podeLancar = fontes.length > 0 && contas.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">
            Receitas
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {periodoLabel}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/fontes-receita"
            className="text-sm text-brand hover:underline"
          >
            Gerenciar fontes de receita
          </Link>
          {!creating && podeLancar && (
            <Button onClick={() => setCreating(true)}>Nova receita</Button>
          )}
        </div>
      </div>

      {pendentes.length > 0 && (
        <div className="rounded-lg border border-cta/40 bg-cta/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Esperado este período
            </h2>
            <span className="font-medium tabular-nums-feature text-neutral-900 dark:text-neutral-100">
              {formatBRL(totalEsperado)}
            </span>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {pendentes.map((pendente) =>
              confirmandoId === pendente.id ? (
                <li key={pendente.id}>
                  <ReceitaForm
                    fontes={fontes}
                    contas={contas}
                    confirmacao={{
                      recorrenteLancamentoId: pendente.id,
                      fonteReceitaId: pendente.fonte_receita_id,
                      valorEsperado: pendente.valor_esperado,
                      dataSugerida: pendente.dataSugerida,
                    }}
                    onDone={() => setConfirmandoId(null)}
                  />
                </li>
              ) : (
                <li
                  key={pendente.id}
                  className="flex items-center justify-between rounded-md bg-white px-3 py-2 dark:bg-neutral-900"
                >
                  <span className="text-sm text-neutral-800 dark:text-neutral-200">
                    {pendente.nome_fonte} — esperado{" "}
                    {formatBRL(pendente.valor_esperado)}
                    {pendente.dataSugerida &&
                      ` em ${formatDateBR(pendente.dataSugerida)}`}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmandoId(pendente.id)}
                  >
                    Confirmar recebimento
                  </Button>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {!podeLancar && (
        <EmptyState
          title="Cadastre uma fonte de receita e uma conta primeiro"
          description="Antes de lançar uma receita, você precisa ter pelo menos uma fonte de receita e uma conta cadastradas."
          action={
            <div className="flex gap-3">
              {fontes.length === 0 && (
                <Link href="/fontes-receita">
                  <Button type="button">Cadastrar fonte de receita</Button>
                </Link>
              )}
              {contas.length === 0 && (
                <Link href="/contas">
                  <Button type="button" variant="secondary">
                    Cadastrar conta
                  </Button>
                </Link>
              )}
            </div>
          }
        />
      )}

      {creating && (
        <ReceitaForm
          fontes={fontes}
          contas={contas}
          onDone={() => setCreating(false)}
        />
      )}

      {podeLancar && receitas.length === 0 && !creating && (
        <EmptyState
          title="Nenhuma receita lançada ainda"
          description="Registre o primeiro recebimento para começar a acompanhar suas entradas."
          action={<Button onClick={() => setCreating(true)}>Lançar a primeira</Button>}
        />
      )}

      <ul className="flex flex-col gap-3">
        {receitas.map((receita) =>
          editingId === receita.id ? (
            <li key={receita.id}>
              <ReceitaForm
                fontes={fontes}
                contas={contas}
                receita={receita}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={receita.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums-feature text-neutral-900 dark:text-neutral-100">
                    {formatBRL(receita.valor)}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {receita.fontes_receita?.nome} · {receita.contas?.nome}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDateBR(receita.data_recebimento)} ·{" "}
                  {receita.tributavel ? "Tributável" : "Não tributável"}
                  {receita.observacao ? ` · ${receita.observacao}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditingId(receita.id)}
                  className="text-sm text-brand hover:underline"
                >
                  Editar
                </button>
                <DeleteButton
                  id={receita.id}
                  action={deleteReceita}
                  confirmMessage={`Excluir o lançamento de ${formatBRL(receita.valor)}?`}
                />
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
