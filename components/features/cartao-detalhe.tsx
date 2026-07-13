"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { fecharFaturaManualmente, marcarFaturaComoPaga } from "@/app/actions/faturas";
import { deleteLancamentoFatura } from "@/app/actions/lancamentos-fatura";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LancamentoFaturaForm } from "@/components/features/lancamento-fatura-form";

type Lancamento = {
  id: string;
  descricao: string;
  valor: number;
  eh_parcelado: boolean;
  parcela_atual: number | null;
  total_parcelas: number | null;
  categorias: { nome: string } | null;
  subcategorias: { nome: string } | null;
};
type Fatura = {
  id: string;
  periodo_inicio: string;
  periodo_fim: string;
  data_vencimento: string;
  status: "aberta" | "fechada" | "paga";
  conta_pagamento_id: string | null;
  lancamentos_fatura: Lancamento[];
};
type Cartao = {
  id: string;
  nome: string;
  dia_fechamento: number;
  dia_vencimento: number;
  conta_pagamento_padrao_id: string | null;
};
type Subcategoria = { id: string; nome: string };
type Categoria = { id: string; nome: string; subcategorias: Subcategoria[] };
type Conta = { id: string; nome: string };

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function totalFatura(fatura: Fatura) {
  return fatura.lancamentos_fatura.reduce((sum, l) => sum + Number(l.valor), 0);
}

function LancamentoItem({
  lancamento,
  cartaoId,
}: {
  lancamento: Lancamento;
  cartaoId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center justify-between rounded-md bg-white px-3 py-2 dark:bg-neutral-900">
      <div>
        <span className="text-sm text-neutral-800 dark:text-neutral-200">
          {lancamento.descricao}
          {lancamento.eh_parcelado &&
            ` (${lancamento.parcela_atual}/${lancamento.total_parcelas})`}
        </span>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {lancamento.categorias?.nome}
          {lancamento.subcategorias?.nome ? ` · ${lancamento.subcategorias.nome}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium tabular-nums-feature text-neutral-900 dark:text-neutral-100">
          {formatBRL(lancamento.valor)}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(`Excluir "${lancamento.descricao}"?`)) return;
            startTransition(() => {
              deleteLancamentoFatura(lancamento.id, cartaoId);
            });
          }}
          className="text-sm text-error hover:underline disabled:opacity-50"
        >
          Excluir
        </button>
      </div>
    </li>
  );
}

function FecharFaturaButton({ faturaId }: { faturaId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Fechar esta fatura antecipadamente?")) return;
          startTransition(async () => {
            const result = await fecharFaturaManualmente(faturaId);
            setError(result?.error);
          });
        }}
      >
        {pending ? "Fechando..." : "Fechar fatura antecipadamente"}
      </Button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

function MarcarPagaForm({ faturaId, contas }: { faturaId: string; contas: Conta[] }) {
  const [pending, startTransition] = useTransition();
  const [contaId, setContaId] = useState(contas[0]?.id ?? "");
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={contaId}
        onChange={(e) => setContaId(e.target.value)}
        className="w-auto"
      >
        {contas.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </Select>
      <Button
        type="button"
        disabled={pending || !contaId}
        onClick={() => {
          startTransition(async () => {
            const result = await marcarFaturaComoPaga(faturaId, contaId);
            setError(result?.error);
          });
        }}
      >
        {pending ? "Salvando..." : "Marcar como paga"}
      </Button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

export function CartaoDetalhe({
  cartao,
  faturaAtual,
  futuras,
  fechadas,
  pagas,
  categorias,
  contas,
}: {
  cartao: Cartao;
  faturaAtual: Fatura | null;
  futuras: Fatura[];
  fechadas: Fatura[];
  pagas: Fatura[];
  categorias: Categoria[];
  contas: Conta[];
}) {
  const [lancando, setLancando] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/cartoes"
            className="text-sm text-neutral-500 hover:underline dark:text-neutral-400"
          >
            ← Cartões
          </Link>
          <h1 className="font-display text-lg font-semibold text-foreground">
            {cartao.nome}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Fecha dia {cartao.dia_fechamento} · vence dia {cartao.dia_vencimento}
          </p>
        </div>
      </div>

      {faturaAtual && (
        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Fatura atual
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatDateBR(faturaAtual.periodo_inicio)} até{" "}
                {formatDateBR(faturaAtual.periodo_fim)} · vence em{" "}
                {formatDateBR(faturaAtual.data_vencimento)}
              </p>
            </div>
            <span className="font-display text-xl font-semibold tabular-nums-feature text-foreground">
              {formatBRL(totalFatura(faturaAtual))}
            </span>
          </div>

          {faturaAtual.lancamentos_fatura.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {faturaAtual.lancamentos_fatura.map((l) => (
                <LancamentoItem key={l.id} lancamento={l} cartaoId={cartao.id} />
              ))}
            </ul>
          )}

          {lancando ? (
            <div className="mt-3">
              <LancamentoFaturaForm
                faturaId={faturaAtual.id}
                categorias={categorias}
                onDone={() => setLancando(false)}
              />
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between">
              <Button onClick={() => setLancando(true)}>Nova compra</Button>
              <FecharFaturaButton faturaId={faturaAtual.id} />
            </div>
          )}
        </section>
      )}

      {futuras.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Próximas faturas (parcelamentos)
          </h2>
          <ul className="flex flex-col gap-2">
            {futuras.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  vence em {formatDateBR(f.data_vencimento)}
                </span>
                <span className="font-medium tabular-nums-feature text-neutral-900 dark:text-neutral-100">
                  {formatBRL(totalFatura(f))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {fechadas.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Faturas fechadas aguardando pagamento
          </h2>
          <ul className="flex flex-col gap-2">
            {fechadas.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-md border border-cta/40 bg-cta/5 p-3"
              >
                <div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    vence em {formatDateBR(f.data_vencimento)}
                  </span>
                  <p className="font-medium tabular-nums-feature text-neutral-900 dark:text-neutral-100">
                    {formatBRL(totalFatura(f))}
                  </p>
                </div>
                <MarcarPagaForm faturaId={f.id} contas={contas} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {pagas.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Histórico de faturas pagas
          </h2>
          <ul className="flex flex-col gap-2">
            {pagas.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
              >
                <span>
                  {formatDateBR(f.periodo_inicio)} até {formatDateBR(f.periodo_fim)}
                </span>
                <span className="font-medium tabular-nums-feature text-neutral-700 dark:text-neutral-300">
                  {formatBRL(totalFatura(f))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
