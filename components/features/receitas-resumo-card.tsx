import Link from "next/link";

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

export function ReceitasResumoCard({
  totalRecebido,
  totalEsperado,
  periodoLabel,
  periodoNav,
}: {
  totalRecebido: number;
  totalEsperado: number;
  periodoLabel: string;
  periodoNav: {
    prevHref: string | null;
    nextHref: string | null;
    isProjetado: boolean;
  } | null;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Receitas
        </h2>
        {periodoNav?.isProjetado && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            Projetado
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
        {periodoNav && <NavArrow href={periodoNav.prevHref} direction="prev" />}
        <span>{periodoLabel}</span>
        {periodoNav && <NavArrow href={periodoNav.nextHref} direction="next" />}
      </div>
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
