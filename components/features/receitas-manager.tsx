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
type PeriodoNav = {
  prevHref: string | null;
  nextHref: string | null;
  isProjetado: boolean;
  isAtual: boolean;
} | null;

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function NavArrow({ href, direction }: { href: string | null; direction: "prev" | "next" }) {
  const symbol = direction === "prev" ? "◀" : "▶";
  if (!href) {
    return <span className="px-1.5 text-neutral-300 dark:text-neutral-700">{symbol}</span>;
  }
  return (
    <Link
      href={href}
      className="rounded px-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-brand dark:text-neutral-400 dark:hover:bg-neutral-800"
      aria-label={direction === "prev" ? "Período anterior" : "Próximo período"}
    >
      {symbol}
    </Link>
  );
}

export function ReceitasManager({
  receitas,
  fontes,
  contas,
  periodoLabel,
  periodoNav,
  pendentes,
  pendentesConfirmaveis,
  totalRecebido,
  totalEsperado,
}: {
  receitas: Receita[];
  fontes: FonteReceita[];
  contas: Conta[];
  periodoLabel: string;
  periodoNav: PeriodoNav;
  pendentes: Pendente[];
  pendentesConfirmaveis: boolean;
  totalRecebido: number;
  totalEsperado: number;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const isProjetado = periodoNav?.isProjetado ?? false;
  const podeLancar = fontes.length > 0 && contas.length > 0 && !isProjetado;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">
            Receitas
          </h1>
          <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
            {periodoNav && <NavArrow href={periodoNav.prevHref} direction="prev" />}
            <span>{periodoLabel}</span>
            {periodoNav && <NavArrow href={periodoNav.nextHref} direction="next" />}
            {isProjetado && (
              <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                Projetado
              </span>
            )}
          </div>
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

      {!isProjetado && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div>
            <p className="font-display text-xl font-semibold tabular-nums-feature text-foreground">
              {formatBRL(totalRecebido)}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Recebido no período
            </p>
          </div>
          {pendentes.length > 0 && (
            <div>
              <p className="font-display text-xl font-semibold tabular-nums-feature text-brand">
                {formatBRL(totalEsperado)}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Esperado (pendente)
              </p>
            </div>
          )}
        </div>
      )}

      {pendentes.length > 0 && (
        <div className="rounded-lg border border-cta/40 bg-cta/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {isProjetado ? "Projeção deste período" : "Esperado este período"}
            </h2>
            {isProjetado && (
              <span className="font-medium tabular-nums-feature text-neutral-900 dark:text-neutral-100">
                {formatBRL(totalEsperado)}
              </span>
            )}
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
                  {pendentesConfirmaveis ? (
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmandoId(pendente.id)}
                    >
                      Confirmar recebimento
                    </Button>
                  ) : (
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                      Projetado
                    </span>
                  )}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {isProjetado && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Este é um período futuro — os valores acima são projeção baseada em
          receitas recorrentes, não dado real.
        </p>
      )}

      {!isProjetado && (fontes.length === 0 || contas.length === 0) && (
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

      {!isProjetado && podeLancar && receitas.length === 0 && !creating && (
        <EmptyState
          title="Nenhuma receita lançada neste período"
          description="Registre um recebimento para começar a acompanhar as entradas do período."
          action={<Button onClick={() => setCreating(true)}>Lançar receita</Button>}
        />
      )}

      {!isProjetado && (
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
      )}
    </div>
  );
}
