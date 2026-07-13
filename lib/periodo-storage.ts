const KEY = "pharos:periodo-p";
const listeners = new Set<() => void>();

/** Último valor de `?p=` visto em qualquer tela com navegação de período. */
export function getStoredPeriodoParam(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setStoredPeriodoParam(value: string | null) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(KEY, value);
  } else {
    window.localStorage.removeItem(KEY);
  }
  listeners.forEach((listener) => listener());
}

/** Pra uso com useSyncExternalStore — notifica quem estiver assinado
 * sempre que setStoredPeriodoParam for chamado, em qualquer componente. */
export function subscribeStoredPeriodoParam(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
