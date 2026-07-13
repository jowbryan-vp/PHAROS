"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import {
  editarValorFinal,
  marcarComoPaga,
} from "@/app/actions/contribuicoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form-message";

type Conta = { id: string; nome: string };
type Contribuicao = {
  id: string;
  receita_id: string;
  valor_sugerido: number;
  valor_final: number;
  status: "comprometido" | "pago";
  data_pagamento: string | null;
  conta_pagamento_id: string | null;
  receita_valor: number;
  receita_data: string;
  nome_fonte: string;
};
type PeriodoNav = {
  prevHref: string | null;
  nextHref: string | null;
  isProjetado: boolean;
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

function MarcarPagaForm({
  contribuicao,
  contas,
  onDone,
}: {
  contribuicao: Contribuicao;
  contas: Conta[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(marcarComoPaga, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-wrap items-center gap-2 rounded-md bg-white p-2 dark:bg-neutral-900"
    >
      <input type="hidden" name="id" value={contribuicao.id} />
      <Select name="conta_pagamento_id" required defaultValue="" className="w-auto">
        <option value="" disabled>
          Selecione a conta
        </option>
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
  contribuicao,
  onDone,
}: {
  contribuicao: Contribuicao;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(editarValorFinal, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-wrap items-center gap-2 rounded-md bg-white p-2 dark:bg-neutral-900"
    >
      <input type="hidden" name="id" value={contribuicao.id} />
      <Input
        name="valor_final"
        type="number"
        step="0.01"
        min="0.01"
        required
        defaultValue={contribuicao.valor_final}
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

function ContribuicaoItem({
  contribuicao,
  contas,
}: {
  contribuicao: Contribuicao;
  contas: Conta[];
}) {
  const [acao, setAcao] = useState<"pagar" | "editar" | null>(null);

  if (acao === "pagar") {
    return (
      <li>
        <MarcarPagaForm
          contribuicao={contribuicao}
          contas={contas}
          onDone={() => setAcao(null)}
        />
      </li>
    );
  }

  if (acao === "editar") {
    return (
      <li>
        <EditarValorForm contribuicao={contribuicao} onDone={() => setAcao(null)} />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between rounded-md bg-white px-3 py-2 dark:bg-neutral-900">
      <div>
        <span className="text-sm text-neutral-800 dark:text-neutral-200">
          {contribuicao.nome_fonte} — {formatBRL(contribuicao.receita_valor)} em{" "}
          {formatDateBR(contribuicao.receita_data)}
        </span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Sugerido: {formatBRL(contribuicao.valor_sugerido)}
          {contribuicao.status === "pago" && contribuicao.data_pagamento && (
            <> · Pago em {formatDateBR(contribuicao.data_pagamento)}</>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium tabular-nums-feature text-neutral-900 dark:text-neutral-100">
          {formatBRL(contribuicao.valor_final)}
        </span>
        {contribuicao.status === "pago" ? (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            Paga
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
            <Button onClick={() => setAcao("pagar")}>Marcar como paga</Button>
          </>
        )}
      </div>
    </li>
  );
}

export function ContribuicoesManager({
  contribuicoes,
  contas,
  periodoLabel,
  periodoNav,
}: {
  contribuicoes: Contribuicao[];
  contas: Conta[];
  periodoLabel: string;
  periodoNav: PeriodoNav;
}) {
  const comprometidas = contribuicoes.filter((c) => c.status === "comprometido");
  const pagas = contribuicoes.filter((c) => c.status === "pago");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold text-foreground">
          Contribuições
        </h1>
        <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
          <NavArrow href={periodoNav?.prevHref ?? null} direction="prev" />
          <span>{periodoLabel}</span>
          <NavArrow href={periodoNav?.nextHref ?? null} direction="next" />
          {periodoNav?.isProjetado && (
            <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              Projetado
            </span>
          )}
        </div>
      </div>

      {contribuicoes.length === 0 && (
        <EmptyState
          title="Nenhuma contribuição neste período"
          description="Contribuições são geradas automaticamente ao lançar uma receita tributável — não há cadastro manual."
        />
      )}

      {comprometidas.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Comprometidas
          </h2>
          <ul className="flex flex-col gap-2">
            {comprometidas.map((c) => (
              <ContribuicaoItem key={c.id} contribuicao={c} contas={contas} />
            ))}
          </ul>
        </div>
      )}

      {pagas.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Pagas
          </h2>
          <ul className="flex flex-col gap-2">
            {pagas.map((c) => (
              <ContribuicaoItem key={c.id} contribuicao={c} contas={contas} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
