function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function GastosFixosResumoCard({
  totalPendente,
  totalPago,
  isProjetado,
}: {
  totalPendente: number;
  totalPago: number;
  isProjetado: boolean;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Gastos Fixos
        </h2>
        {isProjetado && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            Projetado
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums-feature text-brand">
            {formatBRL(totalPendente)}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Pendente
          </p>
        </div>
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums-feature text-foreground">
            {formatBRL(totalPago)}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Pago</p>
        </div>
      </div>
    </div>
  );
}
