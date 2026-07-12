"use client";

import { useTheme } from "@/components/providers/theme-provider";

const LOCKUP_MIN_WIDTH = 120;

const SOURCES = {
  lockup: {
    light: "/brand/pharos-logo-v2-dia.svg",
    dark: "/brand/pharos-logo-v2.svg",
  },
  symbol: {
    light: "/brand/pharos-symbol-dia.svg",
    dark: "/brand/pharos-symbol-noite.svg",
  },
} as const;

type PharosLogoProps = {
  /** Largura de exibição em px. Abaixo de 120px o wordmark some automaticamente. */
  width?: number;
  className?: string;
};

export function PharosLogo({ width = 160, className = "" }: PharosLogoProps) {
  const { theme } = useTheme();
  const variant = width < LOCKUP_MIN_WIDTH ? "symbol" : "lockup";
  const src = SOURCES[variant][theme];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="PHAROS"
      width={width}
      style={{ width, height: "auto" }}
      className={className}
    />
  );
}
