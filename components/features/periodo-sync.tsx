"use client";

import { useEffect } from "react";
import { setStoredPeriodoParam } from "@/lib/periodo-storage";

/**
 * Componente invisível, montado nas telas com navegação de período
 * (Dashboard, Receitas, Gastos Fixos, Contribuições). Guarda o `?p=` atual
 * pra que a Sidebar consiga preservá-lo ao trocar de tela — inclusive
 * passando por telas sem navegação de período (ex: Cartões), que de outra
 * forma perderiam a referência.
 */
export function PeriodoSync({ p }: { p: string | null }) {
  useEffect(() => {
    setStoredPeriodoParam(p);
  }, [p]);

  return null;
}
