function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ReceitasResumoCard({
  total,
  periodoLabel,
}: {
  total: number;
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
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums-feature text-foreground">
        {formatBRL(total)}
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Total recebido no período
      </p>
    </div>
  );
}
