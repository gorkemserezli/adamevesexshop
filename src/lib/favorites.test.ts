import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
} from "./favorites";

const STORAGE_KEY = "ae:favorites";

class FakeStorage {
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
  const ls = new FakeStorage();
  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: ls,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    },
    configurable: true,
  });
});

describe("favorites", () => {
  it("returns [] on empty storage", () => {
    expect(getFavorites()).toEqual([]);
  });

  it("add + isFavorite + remove + toggle round-trip", () => {
    addFavorite("AE-WMO-100");
    expect(isFavorite("AE-WMO-100")).toBe(true);
    expect(getFavorites()).toEqual(["AE-WMO-100"]);

    addFavorite("AE-WMO-100");
    expect(getFavorites()).toEqual(["AE-WMO-100"]);

    addFavorite("AE-LB-001");
    expect(getFavorites()).toEqual(["AE-WMO-100", "AE-LB-001"]);

    expect(toggleFavorite("AE-WMO-100")).toBe(false);
    expect(getFavorites()).toEqual(["AE-LB-001"]);

    removeFavorite("AE-LB-001");
    expect(getFavorites()).toEqual([]);
  });

  it("corruption: malformed JSON resets silently to []", () => {
    (window.localStorage as unknown as { setItem: (k: string, v: string) => void }).setItem(
      STORAGE_KEY,
      "{not json",
    );
    expect(getFavorites()).toEqual([]);
  });

  it("corruption: non-array JSON resets silently to []", () => {
    (window.localStorage as unknown as { setItem: (k: string, v: string) => void }).setItem(
      STORAGE_KEY,
      JSON.stringify({ a: 1 }),
    );
    expect(getFavorites()).toEqual([]);
  });

  it("corruption: mixed array filters non-strings", () => {
    (window.localStorage as unknown as { setItem: (k: string, v: string) => void }).setItem(
      STORAGE_KEY,
      JSON.stringify(["AE-WMO-100", 123, null, "AE-LB-001", { foo: 1 }]),
    );
    expect(getFavorites()).toEqual(["AE-WMO-100", "AE-LB-001"]);
  });
});
