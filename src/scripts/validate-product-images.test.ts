import { describe, it, expect } from "vitest";
// @ts-expect-error — .mjs import without types
import { classifyImagePath } from "./validate-product-images.mjs";

describe("classifyImagePath", () => {
  it("accepts local paths starting with /", () => {
    expect(classifyImagePath("/products/x.jpg")).toBe("local");
    expect(classifyImagePath("/x.jpg")).toBe("local");
    expect(classifyImagePath("/a/b/c.png")).toBe("local");
  });

  it("accepts absolute https URLs", () => {
    expect(classifyImagePath("https://cdn.example.com/x.jpg")).toBe("https");
    expect(classifyImagePath("https://cdn1.xmlbankasi.com/p1/foo/image/data/resimler/-5104.jpg")).toBe("https");
  });

  it("rejects http://", () => {
    expect(classifyImagePath("http://insecure.com/x.jpg")).toBe("reject");
  });

  it("rejects relative paths", () => {
    expect(classifyImagePath("relative.jpg")).toBe("reject");
    expect(classifyImagePath("./x.jpg")).toBe("reject");
    expect(classifyImagePath("../x.jpg")).toBe("reject");
  });

  it("rejects file:// and other schemes", () => {
    expect(classifyImagePath("file:///etc/passwd")).toBe("reject");
    expect(classifyImagePath("ftp://example.com/x.jpg")).toBe("reject");
    expect(classifyImagePath("data:image/png;base64,abc")).toBe("reject");
  });

  it("rejects empty / non-string", () => {
    expect(classifyImagePath("")).toBe("reject");
    // @ts-expect-error — guard branch for non-string
    expect(classifyImagePath(null)).toBe("reject");
    // @ts-expect-error — guard branch for non-string
    expect(classifyImagePath(undefined)).toBe("reject");
  });
});
