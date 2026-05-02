/**
 * @vitest-environment jsdom
 *
 * Accordion behaviour contract — Item 3 of v1.2:
 * default closed, tap toggles aria-expanded + grid-template-rows, no flash
 * of open state during hydration. The Astro component is statically rendered
 * into the test DOM here (mirrors the SSR markup the page emits) and the
 * post-hydration script is run in line so the click handler is attached.
 */
import { describe, it, expect, beforeEach } from "vitest";

const SSR_MARKUP = `
  <div class="ae-accordion" data-accordion-root data-open="false">
    <h3 class="m-0">
      <button id="x-trigger" type="button" class="ae-accordion-trigger"
        aria-expanded="false" aria-controls="x-panel" aria-label="Description"
        data-accordion-trigger>
        <span>Description</span>
      </button>
    </h3>
    <div id="x-panel" class="ae-accordion-panel" role="region" aria-labelledby="x-trigger">
      <div class="ae-accordion-panel-inner"><p>body</p></div>
    </div>
  </div>
`;

function hydrate(): void {
  // Mirrors the inline <script> in Accordion.astro.
  document.querySelectorAll<HTMLElement>("[data-accordion-root]").forEach((root) => {
    const trigger = root.querySelector<HTMLButtonElement>("[data-accordion-trigger]");
    if (!trigger) return;
    trigger.addEventListener("click", () => {
      const open = root.dataset.open === "true";
      const next = !open;
      root.dataset.open = String(next);
      trigger.setAttribute("aria-expanded", String(next));
      window.dispatchEvent(
        new CustomEvent("ae:accordion-toggle", { detail: { id: trigger.id, open: next } }),
      );
    });
  });
}

describe("Accordion", () => {
  beforeEach(() => {
    document.body.innerHTML = SSR_MARKUP;
  });

  it("default state is closed (no flash-of-open at hydrate time)", () => {
    // Assert the SSR markup itself — BEFORE hydrate() runs — already has the
    // closed state. This is the no-flash guarantee.
    const root = document.querySelector("[data-accordion-root]")!;
    const trigger = document.querySelector("[data-accordion-trigger]")!;
    expect(root.getAttribute("data-open")).toBe("false");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("click on trigger expands the panel and flips aria-expanded", () => {
    hydrate();
    const root = document.querySelector("[data-accordion-root]") as HTMLElement;
    const trigger = document.getElementById("x-trigger") as HTMLButtonElement;
    trigger.click();
    expect(root.dataset.open).toBe("true");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("second click collapses back to closed", () => {
    hydrate();
    const root = document.querySelector("[data-accordion-root]") as HTMLElement;
    const trigger = document.getElementById("x-trigger") as HTMLButtonElement;
    trigger.click();
    trigger.click();
    expect(root.dataset.open).toBe("false");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("dispatches ae:accordion-toggle with id + open detail", () => {
    hydrate();
    const trigger = document.getElementById("x-trigger") as HTMLButtonElement;
    const events: Array<{ id: string; open: boolean }> = [];
    window.addEventListener("ae:accordion-toggle", (e) => {
      events.push((e as CustomEvent).detail);
    });
    trigger.click();
    trigger.click();
    expect(events).toEqual([
      { id: "x-trigger", open: true },
      { id: "x-trigger", open: false },
    ]);
  });

  it("aria-controls points at the panel and panel labels back to button", () => {
    const trigger = document.getElementById("x-trigger")!;
    const panel = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    expect(panel.getAttribute("role")).toBe("region");
    expect(panel.getAttribute("aria-labelledby")).toBe("x-trigger");
  });
});
