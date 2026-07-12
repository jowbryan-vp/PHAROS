/**
 * Paleta satélite — contas, cartões e pessoas.
 *
 * Sistema fechado de 8 cores pra evitar caos cromático: o usuário escolhe
 * entre elas ao cadastrar uma conta/cartão/pessoa (formulários reais
 * chegam na Etapa 2+); não existe seletor de cor livre. Duas contas ou
 * pessoas podem repetir cor — nome/ícone já diferenciam.
 *
 * Nunca se sobrepõe semanticamente com `--pharos-amber` (CTA) ou
 * `--pharos-coral` (erro/alerta) — essas duas ficam fora deste conjunto.
 */
export const SATELLITE_COLORS = {
  azulAco: "#4A6FA5",
  ameixa: "#6B4C7A",
  vinho: "#8C4A52",
  terracota: "#B0623E",
  mostarda: "#C9973E",
  salvia: "#7A8B6F",
  ardosia: "#5C6B73",
  cianoSuave: "#5B9AA6",
} as const;

export type SatelliteColorKey = keyof typeof SATELLITE_COLORS;

/**
 * Bancos/instituições conhecidas → cor satélite sugerida automaticamente
 * ao cadastrar uma conta (em vez de deixar o campo em branco). Expandir
 * conforme o usuário adicionar instituições ainda não mapeadas.
 */
export const BANK_COLOR_MAP: Record<string, SatelliteColorKey> = {
  caixa: "azulAco",
  nubank: "ameixa",
  "banco do brasil": "mostarda",
  "mercado pago": "cianoSuave",
};

export function suggestSatelliteColor(
  institutionName: string
): SatelliteColorKey | null {
  return BANK_COLOR_MAP[institutionName.trim().toLowerCase()] ?? null;
}
