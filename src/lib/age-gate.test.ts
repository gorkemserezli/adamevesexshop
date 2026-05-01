import { describe, it, expect, beforeEach } from "vitest";
import { isAgeConfirmed, confirmAge, AGE_STORAGE_KEY, AGE_CONFIRMED_VALUE } from "./age-gate";

class FakeSessionStorage {
  private store: Record<string, string> = {};
  getItem(k: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k]! : null;
  }
  setItem(k: string, v: string): void {
    this.store[k] = v;
  }
  removeItem(k: string): void {
    delete this.store[k];
  }
  clear(): void {
    this.store = {};
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, "window", {
    value: { sessionStorage: new FakeSessionStorage() },
    configurable: true,
  });
});

describe("age-gate", () => {
  it("isAgeConfirmed: false on empty storage", () => {
    expect(isAgeConfirmed()).toBe(false);
  });

  it("confirmAge writes the sentinel; isAgeConfirmed reads it", () => {
    confirmAge();
    expect(window.sessionStorage.getItem(AGE_STORAGE_KEY)).toBe(AGE_CONFIRMED_VALUE);
    expect(isAgeConfirmed()).toBe(true);
  });

  it("isAgeConfirmed: false for any value other than the sentinel", () => {
    window.sessionStorage.setItem(AGE_STORAGE_KEY, "0");
    expect(isAgeConfirmed()).toBe(false);
    window.sessionStorage.setItem(AGE_STORAGE_KEY, "true");
    expect(isAgeConfirmed()).toBe(false);
  });
});
