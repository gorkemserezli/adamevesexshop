export const AGE_STORAGE_KEY = "ae:age-confirmed";
export const AGE_CONFIRMED_VALUE = "1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function isAgeConfirmed(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.sessionStorage.getItem(AGE_STORAGE_KEY) === AGE_CONFIRMED_VALUE;
  } catch {
    return false;
  }
}

export function confirmAge(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(AGE_STORAGE_KEY, AGE_CONFIRMED_VALUE);
  } catch {
    /* private mode or quota — overlay will re-show next nav, which is fine */
  }
}
