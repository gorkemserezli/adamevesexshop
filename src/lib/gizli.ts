export const GIZLI_STORAGE_KEY = "ae:gizli-mode";
export const GIZLI_REVEAL_MS = 3000;

type GizliState = "on" | "off";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getGizli(): GizliState {
  if (!isBrowser()) return "off";
  try {
    return window.localStorage.getItem(GIZLI_STORAGE_KEY) === "on" ? "on" : "off";
  } catch {
    return "off";
  }
}

export function setGizli(state: GizliState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(GIZLI_STORAGE_KEY, state);
    document.documentElement.setAttribute("data-blur", state === "on" ? "on" : "off");
  } catch {
    /* ignore */
  }
}

export function isGizliOn(): boolean {
  return getGizli() === "on";
}

export function attachRevealHandlers(): void {
  if (!isBrowser()) return;
  document.querySelectorAll<HTMLImageElement>("img.ae-product-image").forEach((img) => {
    if (img.dataset.aeRevealBound === "1") return;
    img.dataset.aeRevealBound = "1";
    img.addEventListener("click", () => {
      if (document.documentElement.getAttribute("data-blur") !== "on") return;
      img.classList.add("revealed");
      window.setTimeout(() => img.classList.remove("revealed"), GIZLI_REVEAL_MS);
    });
  });
}
