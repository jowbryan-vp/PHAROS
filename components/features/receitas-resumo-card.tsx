function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ReceitasResumoCard({
  totalRecebido,
  totalEsperado,
  periodoLabel,
}: {
  totalRecebido: number;
  totalEsperado: number;
  periodoLabel: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Receitas
      </h2>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        {periodoLabel}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums-feature text-foreground">
            {formatBRL(totalRecebido)}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Recebido no período
          </p>
        </div>
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums-feature text-brand">
            {formatBRL(totalEsperado)}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Esperado (pendente)
          </p>
        </div>
      </div>
    </div>
  );
}
