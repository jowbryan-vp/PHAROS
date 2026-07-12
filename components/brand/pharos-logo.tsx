"use client";

import { useTheme } from "@/components/providers/theme-provider";

const LOCKUP_MIN_WIDTH = 120;

const SYMBOL_SOURCES = {
  light: "/brand/pharos-symbol-dia.svg",
  dark: "/brand/pharos-symbol-noite.svg",
} as const;

type PharosLogoProps = {
  /** Largura de exibição em px. Abaixo de 120px o wordmark some automaticamente. */
  width?: number;
  className?: string;
};

export function PharosLogo({ width = 160, className = "" }: PharosLogoProps) {
  const { theme } = useTheme();
  const showWordmark = width >= LOCKUP_MIN_WIDTH;
  const symbolHeight = showWordmark ? width * 0.46 : width;

  const symbol = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SYMBOL_SOURCES[theme]}
      alt={showWordmark ? "" : "PHAROS"}
      style={{ height: symbolHeight, width: "auto" }}
    />
  );

  if (!showWordmark) {
    return (
      <span className={`inline-flex ${className}`}>{symbol}</span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      role="img"
      aria-label="PHAROS"
    >
      {symbol}
      <span
        aria-hidden="true"
        className="font-display font-medium leading-none text-foreground"
        style={{ fontSize: width * 0.26 }}
      >
        haros
      </span>
    </span>
  );
}
