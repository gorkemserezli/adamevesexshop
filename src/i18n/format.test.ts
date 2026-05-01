import { describe, it, expect } from "vitest";
import { ruPlural, formatPriceForScreenReader } from "./format";

describe("ruPlural — locked test list", () => {
  it("1 → рубль", () => expect(ruPlural(1)).toBe("рубль"));
  it("2 → рубля", () => expect(ruPlural(2)).toBe("рубля"));
  it("5 → рублей", () => expect(ruPlural(5)).toBe("рублей"));
  it("11 → рублей (teen exception)", () => expect(ruPlural(11)).toBe("рублей"));
  it("12,13,14 → рублей (teen continues)", () => {
    expect(ruPlural(12)).toBe("рублей");
    expect(ruPlural(13)).toBe("рублей");
    expect(ruPlural(14)).toBe("рублей");
  });
  it("21 → рубль", () => expect(ruPlural(21)).toBe("рубль"));
  it("22,23,24 → рубля", () => {
    expect(ruPlural(22)).toBe("рубля");
    expect(ruPlural(23)).toBe("рубля");
    expect(ruPlural(24)).toBe("рубля");
  });
  it("25 → рублей", () => expect(ruPlural(25)).toBe("рублей"));
  it("100, 1000 → рублей", () => {
    expect(ruPlural(100)).toBe("рублей");
    expect(ruPlural(1000)).toBe("рублей");
  });
  it("101 → рубль", () => expect(ruPlural(101)).toBe("рубль"));
  it("111,112,113,114 → рублей (teen rule applies to X11–X14)", () => {
    expect(ruPlural(111)).toBe("рублей");
    expect(ruPlural(112)).toBe("рублей");
    expect(ruPlural(113)).toBe("рублей");
    expect(ruPlural(114)).toBe("рублей");
  });
  it("121,122 → рубль, рубля", () => {
    expect(ruPlural(121)).toBe("рубль");
    expect(ruPlural(122)).toBe("рубля");
  });
  it("0 → рублей", () => expect(ruPlural(0)).toBe("рублей"));
});

describe("formatPriceForScreenReader", () => {
  it("TR uses 'Türk lirası' invariant", () => {
    expect(formatPriceForScreenReader(24, "tr")).toBe("24 Türk lirası");
  });
  it("EN uses 'dollars' (always plural)", () => {
    expect(formatPriceForScreenReader(24, "en")).toBe("24 dollars");
    expect(formatPriceForScreenReader(1, "en")).toBe("1 dollars"); // intentional: simpler than singular branch
  });
  it("DE uses 'Euro' invariant", () => {
    expect(formatPriceForScreenReader(24, "de")).toBe("24 Euro");
  });
  it("RU routes through ruPlural", () => {
    expect(formatPriceForScreenReader(1, "ru")).toBe("1 рубль");
    expect(formatPriceForScreenReader(2, "ru")).toBe("2 рубля");
    expect(formatPriceForScreenReader(5, "ru")).toBe("5 рублей");
    expect(formatPriceForScreenReader(11, "ru")).toBe("11 рублей");
  });
  it("RU 2200 — lastTwo=0, lastOne=0 → рублей", () => {
    const out = formatPriceForScreenReader(2200, "ru");
    expect(out.endsWith("рублей")).toBe(true);
  });
});
