"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { deleteGastoFixo, toggleAtivoGastoFixo } from "@/app/actions/gastos-fixos";
import {
  editarValorLancamento,
  marcarComoPago,
} from "@/app/actions/gastos-fixos-lancamentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { FormMessage } from "@/components/ui/form-message";
import { GastoFixoForm } from "@/components/features/gasto-fixo-form";

type Categoria = { id: string; nome: string };
type Conta = { id: string; nome: string };
type GastoFixo = {
  id: string;
  nome: string;
  valor: number;
  dia_vencimento: number;
  categoria_id: string;
  conta_pagamento_padrao_id: string | null;
  ativo: boolean;
  categorias: { nome: string } | null;
};
type Lancamento = {
  id: string;
  gasto_fixo_id: string;
  valor: number;
  status: "pendente" | "pago";
  conta_pagamento_id: string | null;
  data_pagamento: string | null;
  nome_gasto: string;
  conta_pagamento_padrao_id: string | null;
};
type Projecao = { gastoFixoId: string; nomeGasto: string; valor: number };
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
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

function MarcarPagoForm({
  lancamento,
  contas,
  onDone,
}: {
  lancamento: Lancamento;
  contas: Conta[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(marcarComoPago, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-wrap items-center gap-2 rounded-md bg-white p-2 dark:bg-neutral-900"
    >
      <input type="hidden" name="id" value={lancamento.id} />
      <Select
        name="conta_pagamento_id"
        required
        defaultValue={lancamento.conta_pagamento_padrao_id ?? contas[0]?.id ?? ""}
        className="w-auto"
      >
        {contas.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </Select>
      <Input
        name="data_pagamento"
        type="date"
        required
        defaultValue={todayISO()}
        className="w-auto"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Confirmar"}
      </Button>
      <Button type="button" variant="ghost" onClick={onDone}>
        Cancelar
      </Button>
      <FormMessage error={state?.error} />
    </form>
  );
}

function EditarValorForm({
  lancamento,
  onDone,
}: {
  lancamento: Lancamento;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(editarValorLancamento, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-wrap items-center gap-2 rounded-md bg-white p-2 dark:bg-neutral-900"
    >
      <input type="hidden" name="id" value={lancamento.id} />
      <Input
        name="valor"
        type="number"
        step="0.01"
        min="0.01"
        required
        defaultValue={lancamento.valor}
        className="w-auto"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
      <Button type="button" variant="ghost" onClick={onDone}>
        Cancelar
      </Button>
      <FormMessage error={state?.error} />
    </form>
  );
}

function LancamentoItem({
  lancamento,
  contas,
}: {
  lancamento: Lancamento;
  contas: Conta[];
}) {
  const [acao, setAcao] = useState<"pagar" | "editar" | null>(null);

  if (acao === "pagar") {
    return (
      <li>
        <MarcarPagoForm lancamento={lancamento} contas={contas} onDone={() => setAcao(null)} />
      </li>
    );
  }

  if (acao === "editar") {
    return (
      <li>
        <EditarValorForm lancamento={lancamento} onDone={() => setAcao(null)} />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between rounded-md bg-white px-3 py-2 dark:bg-neutral-900">
      <div>
        <span className="text-sm text-neutral-800 dark:text-neutral-200">
          {lancamento.nome_gasto}
        </span>
        {lancamento.status === "pago" && lancamento.data_pagamento && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pago em {formatDateBR(lancamento.data_pagamento)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium tabular-nums-feature text-neutral-900 dark:text-neutral-100">
          {formatBRL(lancamento.valor)}
        </span>
        {lancamento.status === "pago" ? (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            Pago
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setAcao("editar")}
              className="text-sm text-brand hover:underline"
            >
              Editar valor
            </button>
            <Button onClick={() => setAcao("pagar")}>Marcar como pago</Button>
          </>
        )}
      </div>
    </li>
  );
}

export function GastosFixosManager({
  gastosFixos,
  categorias,
  contas,
  periodoLabel,
  periodoNav,
  lancamentos,
  projecao,
}: {
  gastosFixos: GastoFixo[];
  categorias: Categoria[];
  contas: Conta[];
  periodoLabel: string;
  periodoNav: PeriodoNav;
  lancamentos: Lancamento[];
  projecao: Projecao[];
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isProjetado = periodoNav?.isProjetado ?? false;
  const podeGerenciar = categorias.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold text-foreground">
          Gastos Fixos
        </h1>
        {!creating && podeGerenciar && (
          <Button onClick={() => setCreating(true)}>Novo gasto fixo</Button>
        )}
      </div>

      {!podeGerenciar && (
        <EmptyState
          title="Cadastre uma categoria primeiro"
          description="Antes de cadastrar um gasto fixo, você precisa ter pelo menos uma categoria cadastrada."
          action={
            <Link href="/categorias">
              <Button type="button">Cadastrar categoria</Button>
            </Link>
          }
        />
      )}

      {creating && (
        <GastoFixoForm
          categorias={categorias}
          contas={contas}
          onDone={() => setCreating(false)}
        />
      )}

      {podeGerenciar && gastosFixos.length === 0 && !creating && (
        <EmptyState
          title="Nenhum gasto fixo ainda"
          description="Cadastre despesas com valor e vencimento previsíveis, como plano de saúde ou financiamento."
          action={<Button onClick={() => setCreating(true)}>Criar o primeiro</Button>}
        />
      )}

      {gastosFixos.length > 0 && (
        <ul className="flex flex-col gap-3">
          {gastosFixos.map((gasto) =>
            editingId === gasto.id ? (
              <li key={gasto.id}>
                <GastoFixoForm
                  gastoFixo={gasto}
                  categorias={categorias}
                  contas={contas}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={gasto.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {gasto.nome}
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {formatBRL(gasto.valor)} · vence dia {gasto.dia_vencimento} ·{" "}
                      {gasto.categorias?.nome}
                    </span>
                    {!gasto.ativo && (
                      <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                        Pausado
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingId(gasto.id)}
                    className="text-sm text-brand hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAtivoGastoFixo(gasto.id, !gasto.ativo)}
                    className="text-sm text-brand hover:underline"
                  >
                    {gasto.ativo ? "Pausar" : "Reativar"}
                  </button>
                  <DeleteButton
                    id={gasto.id}
                    action={deleteGastoFixo}
                    confirmMessage={`Excluir o gasto fixo "${gasto.nome}"? Isso só é possível se não houver lançamentos gerados no histórico.`}
                  />
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {gastosFixos.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Lançamentos do período
            </h2>
            <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
              <NavArrow href={periodoNav?.prevHref ?? null} direction="prev" />
              <span>{periodoLabel}</span>
              <NavArrow href={periodoNav?.nextHref ?? null} direction="next" />
              {isProjetado && (
                <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  Projetado
                </span>
              )}
            </div>
          </div>

          {isProjetado && projecao.length > 0 && (
            <ul className="flex flex-col gap-2">
              {projecao.map((p) => (
                <li
                  key={p.gastoFixoId}
                  className="flex items-center justify-between rounded-md bg-white px-3 py-2 dark:bg-neutral-900"
                >
                  <span className="text-sm text-neutral-800 dark:text-neutral-200">
                    {p.nomeGasto}
                  </span>
                  <span className="font-medium tabular-nums-feature text-neutral-900 dark:text-neutral-100">
                    {formatBRL(p.valor)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {isProjetado && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Este é um período futuro — os valores acima são projeção baseada nos
              gastos fixos ativos, não dado real.
            </p>
          )}

          {!isProjetado && lancamentos.length === 0 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Nenhum lançamento de gasto fixo neste período.
            </p>
          )}

          {!isProjetado && lancamentos.length > 0 && (
            <ul className="flex flex-col gap-2">
              {lancamentos.map((l) => (
                <LancamentoItem key={l.id} lancamento={l} contas={contas} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
