import { describe, it, expect, beforeEach } from "vitest";
import { getGizli, setGizli, isGizliOn, GIZLI_STORAGE_KEY } from "./gizli";

class FakeLocalStorage {
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
  const html = { _attrs: {} as Record<string, string>, setAttribute(k: string, v: string) { this._attrs[k] = v; }, getAttribute(k: string) { return this._attrs[k] ?? null; } };
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: new FakeLocalStorage() },
    configurable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: { documentElement: html },
    configurable: true,
  });
});

describe("gizli", () => {
  it("default is off", () => {
    expect(getGizli()).toBe("off");
    expect(isGizliOn()).toBe(false);
  });

  it("setGizli('on') persists and toggles html[data-blur]", () => {
    setGizli("on");
    expect(getGizli()).toBe("on");
    expect(isGizliOn()).toBe(true);
    expect(window.localStorage.getItem(GIZLI_STORAGE_KEY)).toBe("on");
    expect(document.documentElement.getAttribute("data-blur")).toBe("on");
  });

  it("setGizli('off') clears html[data-blur]", () => {
    setGizli("on");
    setGizli("off");
    expect(getGizli()).toBe("off");
    expect(document.documentElement.getAttribute("data-blur")).toBe("off");
  });

  it("any value other than 'on' reads as off", () => {
    window.localStorage.setItem(GIZLI_STORAGE_KEY, "true");
    expect(getGizli()).toBe("off");
    window.localStorage.setItem(GIZLI_STORAGE_KEY, "1");
    expect(getGizli()).toBe("off");
  });
});
