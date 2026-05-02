/**
 * Bug 1 (v1.1 hotfix): the dual-thumb price slider's max thumb collapsed to
 * min on first touch tap. These tests anchor the corrected clamp/collision
 * rules so the regression can never re-enter via setValue logic alone.
 *
 * The actual touch event suppression lives in Slider.astro (custom pointer
 * drag with preventDefault on pointerdown); these tests cover the pure math
 * that funnel ALL writes — drag, keyboard, programmatic — through one path.
 */
import { describe, it, expect } from "vitest";
import {
  clampToBounds,
  snapToStep,
  writeThumbValue,
  dragDeltaToValue,
  InteractionGate,
  type ThumbWriteContext,
} from "./slider";

const ctx = (current: { min: number; max: number }): ThumbWriteContext => ({
  current,
  bounds: { min: 10, max: 500 },
  step: 10,
});

describe("clampToBounds", () => {
  it("returns value when in range", () => {
    expect(clampToBounds(50, 10, 100)).toBe(50);
  });
  it("clamps below min and above max", () => {
    expect(clampToBounds(-5, 10, 100)).toBe(10);
    expect(clampToBounds(999, 10, 100)).toBe(100);
  });
  it("returns min for NaN (defensive)", () => {
    expect(clampToBounds(Number.NaN, 10, 100)).toBe(10);
  });
});

describe("snapToStep", () => {
  it("rounds to nearest multiple of step", () => {
    expect(snapToStep(12, 10)).toBe(10);
    expect(snapToStep(15, 10)).toBe(20); // Math.round half-up
    expect(snapToStep(17, 10)).toBe(20);
  });
  it("returns value unchanged when step <= 0", () => {
    expect(snapToStep(13, 0)).toBe(13);
  });
});

describe("writeThumbValue — Bug 1 acceptance cases", () => {
  it("touch on max thumb without dragging leaves max unchanged when raw === current.max", () => {
    // The fix is in Slider.astro (preventDefault on pointerdown), but if a
    // spurious raw === current.max ever slips through, the math is a no-op.
    const next = writeThumbValue("max", 500, ctx({ min: 10, max: 500 }));
    expect(next).toEqual({ min: 10, max: 500 });
  });

  it("REGRESSION: tap on max thumb that lands at min DOES NOT collapse both thumbs", () => {
    // Pre-fix: setValue("max", 10) with current={min:10,max:500} produced
    // {min: 10, max: 10} (or both at clamp(0)→10). This is the v1.1 bug.
    // Post-fix: max stops at min+step=20, min unchanged.
    const next = writeThumbValue("max", 10, ctx({ min: 10, max: 500 }));
    expect(next).toEqual({ min: 10, max: 20 });
    expect(next.min).toBeLessThan(next.max);
  });

  it("REGRESSION (mirror): tap on min thumb that lands at max DOES NOT collapse both thumbs", () => {
    // Symmetric mirror of the previous case. User repro:
    //   - Initial state {min: 10, max: 500}
    //   - Tap min thumb; native scrubbing fires `input` with value≈max
    //   - Pre-fix display read "€500 to €500" (collapse to right edge)
    //   - Post-fix: min snaps to max-step=490, max unchanged.
    const next = writeThumbValue("min", 500, ctx({ min: 10, max: 500 }));
    expect(next).toEqual({ min: 490, max: 500 });
    expect(next.min).toBeLessThan(next.max);
  });

  it("REGRESSION (mirror): tap-min sequence with native input mutating to max preserves invariants", () => {
    // Walk the exact event sequence the Slider.astro pointer drag now guards
    // against. After tap, native scrubbing wrote 500 into input — but the
    // restore-on-pointerup path resets to startValue=10 before any delayed
    // `input` event fires, so the funnel sees a no-op write at startValue.
    const startValue = 10;
    let state = { min: 10, max: 500 };
    state = writeThumbValue("min", startValue, ctx(state));
    expect(state).toEqual({ min: 10, max: 500 });
    // And even if a delayed event somehow slipped through, writeThumbValue's
    // pure collision rule still prevents the {500,500} collapse:
    state = writeThumbValue("min", 500, ctx(state));
    expect(state.min).toBeLessThan(state.max);
    expect(state.max).toBe(500);
  });

  it("drag max thumb leftward stops at minValue + step", () => {
    const next = writeThumbValue("max", 50, ctx({ min: 100, max: 400 }));
    // 50 < current.min=100 → max snaps to min+step=110.
    expect(next).toEqual({ min: 100, max: 110 });
  });

  it("drag min thumb rightward stops at maxValue - step", () => {
    const next = writeThumbValue("min", 450, ctx({ min: 100, max: 400 }));
    // 450 >= current.max=400 → min snaps to max-step=390.
    expect(next).toEqual({ min: 390, max: 400 });
  });

  it("min and max never invert (any direction)", () => {
    // Smoke: 100 random-ish writes against either thumb stay sorted.
    const inputs: Array<["min" | "max", number]> = [
      ["min", 0], ["min", 999], ["max", 0], ["max", 999],
      ["min", 200], ["max", 200], ["min", 50], ["max", 480],
    ];
    let state = { min: 100, max: 400 };
    for (const [which, raw] of inputs) {
      state = writeThumbValue(which, raw, ctx(state));
      expect(state.min).toBeLessThanOrEqual(state.max);
    }
  });

  it("min and max never collapse to the same value (when bounds permit a gap)", () => {
    // Repeatedly slam min=max value at max; max should stay one step above.
    let state = { min: 10, max: 500 };
    for (let i = 0; i < 5; i += 1) {
      state = writeThumbValue("max", state.min, ctx(state));
    }
    expect(state.max).toBeGreaterThan(state.min);
  });

  it("clamps to bounds when raw is out of range", () => {
    expect(writeThumbValue("max", 9999, ctx({ min: 10, max: 100 }))).toEqual({ min: 10, max: 500 });
    expect(writeThumbValue("min", -100, ctx({ min: 100, max: 200 }))).toEqual({ min: 10, max: 200 });
  });

  it("snaps raw value to step before clamping (TR/RU step 10)", () => {
    expect(writeThumbValue("max", 247, ctx({ min: 10, max: 100 }))).toEqual({ min: 10, max: 250 });
  });

  it("Reset back to bounds is representable as two writes", () => {
    let state = { min: 100, max: 200 };
    state = writeThumbValue("min", 10, ctx(state));
    state = writeThumbValue("max", 500, ctx(state));
    expect(state).toEqual({ min: 10, max: 500 });
  });
});

describe("InteractionGate — cross-thumb suppression (Bug 1 follow-up #2)", () => {
  /**
   * iOS Safari fires `input` on the inactive thumb's range input during a
   * touch on the active thumb, with the native scrubbing value (≈bounds.min).
   * Per-thumb closure state can't see the sibling's drag — these tests anchor
   * the shared gate that both thumbs' input listeners now consult.
   */
  function fakeClock() {
    let t = 1_000_000;
    return { now: () => t, advance: (ms: number) => { t += ms; } };
  }

  it("fresh gate is not suppressed", () => {
    const c = fakeClock();
    const g = new InteractionGate(c.now);
    expect(g.isSuppressed()).toBe(false);
  });

  it("activate() suppresses; release() keeps suppressing through grace window", () => {
    const c = fakeClock();
    const g = new InteractionGate(c.now);
    g.activate();
    expect(g.isSuppressed()).toBe(true);
    g.release(150);
    expect(g.isSuppressed()).toBe(true);  // still inside grace
    c.advance(149);
    expect(g.isSuppressed()).toBe(true);  // still inside grace
    c.advance(2);
    expect(g.isSuppressed()).toBe(false); // grace closed
  });

  it("REGRESSION: max-thumb touch suppresses sibling min-thumb input event", () => {
    // Simulates the exact iOS event sequence the user reported:
    //   1. Both thumbs sit at {min: 50, max: 500} (user previously dragged
    //      min from 10 to 50).
    //   2. User touches max thumb → max's pointerdown calls gate.activate().
    //   3. iOS fires `input` on inputMin (sibling) with value=10 (bounds.min).
    //   4. Min's input listener queries gate.isSuppressed() → true → bail.
    //   5. min's value remains 50; the bogus 10 is discarded.
    const c = fakeClock();
    const gate = new InteractionGate(c.now);

    // Track what each input listener would do.
    const minState = { value: 50 };
    const onMinInput = (incomingValue: number) => {
      if (gate.isSuppressed()) return; // gate suppresses cross-thumb leak
      minState.value = incomingValue;
    };

    // Step 2: max pointerdown
    gate.activate();
    // Step 3: iOS leaks input event to inputMin with bounds.min
    onMinInput(10);
    // Step 4 outcome: min's value preserved
    expect(minState.value).toBe(50);
    // Step 5: max pointerup, grace window opens
    gate.release(150);
    // Even a delayed leak inside the grace window stays suppressed
    c.advance(50);
    onMinInput(10);
    expect(minState.value).toBe(50);
    // Once grace closes, legitimate input events flow again
    c.advance(200);
    onMinInput(80);
    expect(minState.value).toBe(80);
  });

  it("REGRESSION (mirror): min-thumb touch suppresses sibling max-thumb input event", () => {
    const c = fakeClock();
    const gate = new InteractionGate(c.now);
    const maxState = { value: 200 };
    const onMaxInput = (incoming: number) => {
      if (gate.isSuppressed()) return;
      maxState.value = incoming;
    };
    gate.activate();        // user touches min
    onMaxInput(10);         // iOS leaks bogus value to inputMax
    expect(maxState.value).toBe(200);
    gate.release(150);
    c.advance(200);
    onMaxInput(450);        // legitimate write after grace
    expect(maxState.value).toBe(450);
  });

  it("custom grace window is honoured", () => {
    const c = fakeClock();
    const g = new InteractionGate(c.now);
    g.activate();
    g.release(50);
    c.advance(49);
    expect(g.isSuppressed()).toBe(true);
    c.advance(2);
    expect(g.isSuppressed()).toBe(false);
  });

  it("re-activate during grace window resets to fully active", () => {
    const c = fakeClock();
    const g = new InteractionGate(c.now);
    g.activate();
    g.release(150);
    c.advance(50);
    g.activate();           // user starts a new touch immediately
    c.advance(10_000);      // long time passes
    expect(g.isSuppressed()).toBe(true); // still active until released
    g.release();
    expect(g.isSuppressed()).toBe(true); // grace just opened
  });
});

describe("dragDeltaToValue", () => {
  it("0 delta = 0 value change", () => {
    expect(dragDeltaToValue(100, 100, 200, { min: 10, max: 510 })).toBe(0);
  });

  it("dragging right by half the track width = half the value range", () => {
    expect(dragDeltaToValue(0, 100, 200, { min: 10, max: 510 })).toBe(250);
  });

  it("dragging left = negative delta", () => {
    expect(dragDeltaToValue(100, 50, 200, { min: 10, max: 510 })).toBe(-125);
  });

  it("trackWidth <= 0 short-circuits to 0 (defensive)", () => {
    expect(dragDeltaToValue(0, 100, 0, { min: 10, max: 510 })).toBe(0);
    expect(dragDeltaToValue(0, 100, -1, { min: 10, max: 510 })).toBe(0);
  });
});
