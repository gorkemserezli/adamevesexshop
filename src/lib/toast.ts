export const TOAST_DURATION_MS = 2400;

let activeTimer: number | null = null;

function ensureContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById("ae-toast");
}

export function showToast(message: string): void {
  const el = ensureContainer();
  if (!el) return;
  const labelEl = el.querySelector<HTMLSpanElement>(".ae-toast-label");
  if (!labelEl) return;
  if (activeTimer !== null) {
    window.clearTimeout(activeTimer);
    activeTimer = null;
  }
  labelEl.textContent = message;
  el.dataset.toastState = "visible";
  activeTimer = window.setTimeout(() => {
    el.dataset.toastState = "hidden";
    activeTimer = null;
  }, TOAST_DURATION_MS);
}
