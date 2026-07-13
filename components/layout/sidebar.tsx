"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getStoredPeriodoParam,
  subscribeStoredPeriodoParam,
} from "@/lib/periodo-storage";

const LINKS = [
  { label: "Início", href: "/dashboard" },
  { label: "Receitas", href: "/receitas" },
  { label: "Contas", href: "/contas" },
  { label: "Categorias", href: "/categorias" },
  { label: "Cartões", href: "/cartoes" },
  { label: "Gastos Fixos", href: "/gastos-fixos" },
  { label: "Contribuições", href: "/contribuicoes" },
];

/** Telas com navegação de período (?p=) — as únicas em que faz sentido
 * propagar o período guardado ao trocar de tela pela sidebar. */
const PERIODO_AWARE = new Set(["/dashboard", "/receitas", "/gastos-fixos", "/contribuicoes"]);

const DISABLED_ITEMS = ["Cofrinhos"];

export function Sidebar() {
  const pathname = usePathname();
  const storedP = useSyncExternalStore(
    subscribeStoredPeriodoParam,
    getStoredPeriodoParam,
    () => null
  );

  return (
    <nav className="hidden w-56 shrink-0 border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 md:block">
      <ul className="flex flex-col gap-1">
        {LINKS.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          const href =
            storedP && PERIODO_AWARE.has(link.href)
              ? `${link.href}?p=${encodeURIComponent(storedP)}`
              : link.href;
          return (
            <li key={link.href}>
              <Link
                href={href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
        {DISABLED_ITEMS.map((item) => (
          <li
            key={item}
            className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-neutral-400 dark:text-neutral-600"
            title="Disponível em uma etapa futura"
          >
            {item}
          </li>
        ))}
      </ul>
    </nav>
  );
}
