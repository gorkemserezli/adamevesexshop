const STORAGE_KEY = "ae:favorites";
const EVENT_NAME = "ae:favorites-changed";

type Listener = (favorites: string[]) => void;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function read(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return [];
  }
}

function write(skus: string[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(skus));
    window.dispatchEvent(new CustomEvent<string[]>(EVENT_NAME, { detail: skus }));
  } catch {
    /* quota or private mode — silently ignore */
  }
}

export function getFavorites(): string[] {
  return read();
}

export function isFavorite(sku: string): boolean {
  return read().includes(sku);
}

export function addFavorite(sku: string): void {
  const current = read();
  if (current.includes(sku)) return;
  write([...current, sku]);
}

export function removeFavorite(sku: string): void {
  const current = read();
  const next = current.filter((s) => s !== sku);
  if (next.length === current.length) return;
  write(next);
}

export function toggleFavorite(sku: string): boolean {
  if (isFavorite(sku)) {
    removeFavorite(sku);
    return false;
  }
  addFavorite(sku);
  return true;
}

export function subscribeToFavorites(callback: Listener): () => void {
  if (!isBrowser()) return () => {};
  const onLocal = (e: Event) => {
    const ce = e as CustomEvent<string[]>;
    callback(ce.detail ?? read());
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    callback(read());
  };
  window.addEventListener(EVENT_NAME, onLocal as EventListener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onLocal as EventListener);
    window.removeEventListener("storage", onStorage);
  };
}
