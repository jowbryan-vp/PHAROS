import Link from "next/link";

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

/**
 * Único seletor de período do Dashboard — controla todos os cards da grade
 * ao mesmo tempo (não há navegação por card).
 */
export function DashboardPeriodoNav({
  periodoLabel,
  periodoNav,
}: {
  periodoLabel: string;
  periodoNav: {
    prevHref: string | null;
    nextHref: string | null;
    isProjetado: boolean;
  } | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-display text-lg font-semibold text-foreground">Dashboard</h1>
      <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
        {periodoNav && <NavArrow href={periodoNav.prevHref} direction="prev" />}
        <span>{periodoLabel}</span>
        {periodoNav && <NavArrow href={periodoNav.nextHref} direction="next" />}
        {periodoNav?.isProjetado && (
          <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            Projetado
          </span>
        )}
      </div>
    </div>
  );
}
