/**
 * Pure helpers for the dual-thumb price slider.
 *
 * Lives outside the Astro component so the clamp/collision rules can be unit
 * tested without a DOM. Slider.astro imports `writeThumbValue` and uses it as
 * the single funnel for every value-change entry point (drag, keyboard, tap).
 *
 * Bug 1 (v1.1 hotfix): a touch tap on the max thumb used to fire the native
 * range input's "click-to-position" with value≈min, which the old setValue
 * collision branch then wrote into BOTH thumbs (max=min, min=clamp(min-step)),
 * collapsing the slider. The fixes here:
 *   - writeThumbValue clamps the moved thumb to "other ± step" instead of
 *     pushing the other thumb. The min/max never invert and never collapse.
 *   - Slider.astro replaces native scrubbing with custom pointer drag, so a
 *     tap without movement leaves the value unchanged.
 */

export interface SliderRange {
  readonly min: number;
  readonly max: number;
}

export interface ThumbWriteContext {
  readonly current: SliderRange;
  readonly bounds: SliderRange;
  readonly step: number;
}

export function clampToBounds(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function snapToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

/**
 * Compute the next slider range after writing a raw value to one thumb.
 *
 * Collision rule (Bug 1): if the moved thumb would meet/cross the other,
 * it stops at `other ± step`. The other thumb does NOT move. Both thumbs
 * stay within `bounds` and never invert.
 */
export function writeThumbValue(
  which: "min" | "max",
  raw: number,
  ctx: ThumbWriteContext,
): SliderRange {
  const { current, bounds, step } = ctx;
  const v = clampToBounds(snapToStep(raw, step), bounds.min, bounds.max);
  if (which === "min") {
    if (v >= current.max) {
      return { min: clampToBounds(current.max - step, bounds.min, bounds.max), max: current.max };
    }
    return { min: v, max: current.max };
  }
  if (v <= current.min) {
    return { min: current.min, max: clampToBounds(current.min + step, bounds.min, bounds.max) };
  }
  return { min: current.min, max: v };
}

/**
 * Convert pointer-drag pixel delta into a slider value delta. Caller adds the
 * result to the value at drag start, then funnels through writeThumbValue.
 */
export function dragDeltaToValue(
  startX: number,
  currentX: number,
  trackWidth: number,
  bounds: SliderRange,
): number {
  if (trackWidth <= 0) return 0;
  const dPct = (currentX - startX) / trackWidth;
  return dPct * (bounds.max - bounds.min);
}

/**
 * Cross-thumb interaction gate.
 *
 * Bug 1 follow-up #2 (iOS Safari only): touching one thumb fires `input` on
 * the OTHER thumb's `<input type=range>` (carrying the native scrubbing value,
 * usually bounds.min). Per-thumb closure state in Slider.astro can't see the
 * sibling thumb's drag state, so the inactive thumb's listener happily wrote
 * the bogus value via applyWrite. This gate is shared between both thumbs:
 *   - activate() on either thumb's pointerdown
 *   - release(grace) on either thumb's pointerup/cancel — opens a window
 *   - isSuppressed() returns true while either thumb is dragging OR within
 *     the post-release grace window. Both thumbs' `input` listeners consult
 *     it before calling applyWrite.
 */
export class InteractionGate {
  private active = false;
  private suppressUntil = 0;
  private readonly now: () => number;

  constructor(now: () => number = () => Date.now()) {
    this.now = now;
  }

  activate(): void {
    this.active = true;
  }

  release(graceMs = 150): void {
    this.active = false;
    this.suppressUntil = this.now() + graceMs;
  }

  isSuppressed(): boolean {
    return this.active || this.now() < this.suppressUntil;
  }
}
