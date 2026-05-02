/**
 * @vitest-environment jsdom
 *
 * ZoomModal behaviour contract — Item 2 of v1.2:
 * open/close, ESC dismiss, backdrop dismiss, X button dismiss, body scroll
 * lock, focus trap. Tests run the inline hydration script against an SSR
 * markup snapshot of the modal so the public window.aeZoom API is wired up.
 */
import { describe, it, expect, beforeEach } from "vitest";

const SSR_MARKUP = `
  <button id="prev-focus" type="button">prev</button>
  <div id="ae-zoom-modal" class="ae-zoom-modal" role="dialog" aria-modal="true"
       aria-labelledby="ae-zoom-modal-title" data-modal-state="closed" aria-hidden="true">
    <div class="ae-zoom-backdrop" data-zoom-dismiss aria-hidden="true"></div>
    <button type="button" class="ae-zoom-close" data-zoom-dismiss aria-label="Close zoom">X</button>
    <h2 id="ae-zoom-modal-title" class="sr-only">Test product</h2>
    <div class="ae-zoom-track" data-zoom-track role="region" aria-roledescription="carousel">
      <div class="ae-zoom-slide" data-zoom-slide-index="0" role="group" aria-label="Image 1 of 3">
        <img class="ae-zoom-image" src="/a.jpg" alt="" />
      </div>
      <div class="ae-zoom-slide" data-zoom-slide-index="1" role="group" aria-label="Image 2 of 3">
        <img class="ae-zoom-image" src="/b.jpg" alt="" />
      </div>
      <div class="ae-zoom-slide" data-zoom-slide-index="2" role="group" aria-label="Image 3 of 3">
        <img class="ae-zoom-image" src="/c.jpg" alt="" />
      </div>
    </div>
    <div role="tablist" aria-label="Image 1 of 3" data-zoom-dots>
      <button type="button" class="ae-zoom-dot" data-zoom-dot-index="0" role="tab"
        aria-selected="true" aria-label="Image 1 of 3"></button>
      <button type="button" class="ae-zoom-dot" data-zoom-dot-index="1" role="tab"
        aria-selected="false" aria-label="Image 2 of 3"></button>
      <button type="button" class="ae-zoom-dot" data-zoom-dot-index="2" role="tab"
        aria-selected="false" aria-label="Image 3 of 3"></button>
    </div>
  </div>
`;

/**
 * Trimmed translation of ZoomModal.astro's inline script. jsdom doesn't run
 * IntersectionObserver naturally; we stub it to a noop so the script can
 * register slides without crashing. The behaviours under test (open/close,
 * Esc, dot click, focus trap) don't require IO firings.
 */
function hydrate(): void {
  // @ts-expect-error — minimal jsdom stub
  globalThis.IntersectionObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };

  const modal = document.getElementById("ae-zoom-modal");
  if (!modal) return;
  const track = modal.querySelector<HTMLElement>("[data-zoom-track]");
  const slides = Array.from(modal.querySelectorAll<HTMLElement>(".ae-zoom-slide"));
  const dots = Array.from(modal.querySelectorAll<HTMLButtonElement>(".ae-zoom-dot"));
  const closeBtns = Array.from(modal.querySelectorAll<HTMLElement>("[data-zoom-dismiss]"));
  let lastFocused: HTMLElement | null = null;

  function paintActive(active: number): void {
    dots.forEach((d, i) => {
      d.setAttribute("aria-selected", i === active ? "true" : "false");
    });
  }
  function open(index: number): void {
    lastFocused = document.activeElement as HTMLElement | null;
    modal!.dataset.modalState = "open";
    modal!.setAttribute("aria-hidden", "false");
    document.body.classList.add("ae-modal-open");
    const target = slides[index];
    if (target && track) track.scrollLeft = (target as HTMLElement).offsetLeft;
    paintActive(index);
    const closeBtn = modal!.querySelector<HTMLButtonElement>(".ae-zoom-close");
    closeBtn?.focus();
  }
  function close(): void {
    modal!.dataset.modalState = "closed";
    modal!.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ae-modal-open");
    lastFocused?.focus();
  }

  closeBtns.forEach((b) => b.addEventListener("click", close));
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => paintActive(i));
  });

  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    const focusables = Array.from(
      modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  (window as unknown as { aeZoom: { open: (i: number) => void; close: () => void } }).aeZoom = {
    open,
    close,
  };
}

describe("ZoomModal", () => {
  beforeEach(() => {
    document.body.innerHTML = SSR_MARKUP;
    document.body.classList.remove("ae-modal-open");
    hydrate();
  });

  it("starts closed (data-modal-state=closed, aria-hidden=true, no body lock)", () => {
    const modal = document.getElementById("ae-zoom-modal")!;
    expect(modal.dataset.modalState).toBe("closed");
    expect(modal.getAttribute("aria-hidden")).toBe("true");
    expect(document.body.classList.contains("ae-modal-open")).toBe(false);
  });

  it("aeZoom.open(idx) opens the modal, locks body scroll, focuses close button", () => {
    const prev = document.getElementById("prev-focus")!;
    prev.focus();
    (window as unknown as { aeZoom: { open: (i: number) => void } }).aeZoom.open(1);
    const modal = document.getElementById("ae-zoom-modal")!;
    expect(modal.dataset.modalState).toBe("open");
    expect(modal.getAttribute("aria-hidden")).toBe("false");
    expect(document.body.classList.contains("ae-modal-open")).toBe(true);
    expect(document.activeElement?.classList.contains("ae-zoom-close")).toBe(true);
  });

  it("opening at index N marks dot N as aria-selected", () => {
    (window as unknown as { aeZoom: { open: (i: number) => void } }).aeZoom.open(2);
    const dots = document.querySelectorAll<HTMLButtonElement>(".ae-zoom-dot");
    expect(dots[0]!.getAttribute("aria-selected")).toBe("false");
    expect(dots[1]!.getAttribute("aria-selected")).toBe("false");
    expect(dots[2]!.getAttribute("aria-selected")).toBe("true");
  });

  it("Esc key closes modal and unlocks body scroll", () => {
    (window as unknown as { aeZoom: { open: (i: number) => void } }).aeZoom.open(0);
    const modal = document.getElementById("ae-zoom-modal")!;
    modal.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(modal.dataset.modalState).toBe("closed");
    expect(document.body.classList.contains("ae-modal-open")).toBe(false);
  });

  it("X button click closes modal", () => {
    (window as unknown as { aeZoom: { open: (i: number) => void } }).aeZoom.open(0);
    const closeBtn = document.querySelector<HTMLButtonElement>(".ae-zoom-close")!;
    closeBtn.click();
    expect(document.getElementById("ae-zoom-modal")!.dataset.modalState).toBe("closed");
  });

  it("backdrop click closes modal", () => {
    (window as unknown as { aeZoom: { open: (i: number) => void } }).aeZoom.open(0);
    const backdrop = document.querySelector<HTMLElement>(".ae-zoom-backdrop")!;
    backdrop.click();
    expect(document.getElementById("ae-zoom-modal")!.dataset.modalState).toBe("closed");
  });

  it("close restores focus to the element that opened it", () => {
    const prev = document.getElementById("prev-focus")!;
    prev.focus();
    expect(document.activeElement).toBe(prev);
    const z = (window as unknown as { aeZoom: { open: (i: number) => void; close: () => void } }).aeZoom;
    z.open(0);
    z.close();
    expect(document.activeElement).toBe(prev);
  });

  it("Tab on the last focusable wraps to the first (focus trap)", () => {
    (window as unknown as { aeZoom: { open: (i: number) => void } }).aeZoom.open(0);
    const focusables = Array.from(
      document.querySelectorAll<HTMLElement>(
        '#ae-zoom-modal button, #ae-zoom-modal [href], #ae-zoom-modal input, #ae-zoom-modal select, #ae-zoom-modal textarea, #ae-zoom-modal [tabindex]:not([tabindex="-1"])',
      ),
    );
    const last = focusables[focusables.length - 1]!;
    last.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    document.getElementById("ae-zoom-modal")!.dispatchEvent(event);
    // After event handler runs, focus should snap back to the first focusable.
    expect(document.activeElement).toBe(focusables[0]);
  });
});
