import type { ReactNode } from "react";

/**
 * Card individual de estatística da grade do Dashboard. Cada etapa futura
 * (Contribuição, Cofrinhos, Saldo Projetado) só precisa renderizar mais um
 * <DashboardCard> dentro de uma <DashboardSection>, sem redesenhar layout.
 */
export function DashboardCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "highlight";
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p
        className={`font-display text-xl font-semibold tabular-nums-feature ${
          tone === "highlight" ? "text-brand" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}

/** Agrupa DashboardCards sob um título — uma "linha" da grade do Dashboard. */
export function DashboardSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}
