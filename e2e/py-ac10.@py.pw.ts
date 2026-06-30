// AC-10 (@py) — the projectile reference item 6.13(b) sustains its configured
// 30 Hz tick cadence with ≤ 5 % missed ticks (§12 AC-10, NFR-PY-004).
//
// MEASUREMENT METHOD (and its limitation).
//
// The host drives ticks via requestAnimationFrame, firing a TICK whenever
// >= 1000/tick_hz ms (33.3 ms at 30 Hz) have elapsed, passing the real wall
// delta as dt (src/python/use-py-item.ts). Each tick re-renders the item, and
// the projectile's transport Text shows `t = {sim_time:.2f} s` where sim_time
// accumulates dt. So:
//
//   * EFFECTIVE TICK RATE is measured by counting DISTINCT sim_time readings
//     (each new value == one applied tick) over a wall-clock window, sampled in
//     the page on every animation frame (so we never miss a value). distinct /
//     wall_seconds == effective Hz; we assert it is within 5 % of 30 Hz (i.e.
//     >= 28.5 Hz) — equivalently ≤ 5 % missed ticks (NFR-PY-004 / AC-10).
//
//   * SIM-TIME-vs-WALL is also asserted (sim_time advances ≈ wall time within
//     5 %), confirming the integrator keeps pace and no ticks are double-applied.
//
// LIMITATION (documented in e2e/README.md): item 6.13(b) PAUSES when the
// projectile lands (y returns to 0), so it cannot tick continuously for a full
// 20 s without changing src/ or the content (both out of scope here). We
// therefore configure the LONGEST achievable flight (max angle 80°, max speed
// 40 m/s → ~8 s of flight) and measure the cadence across that flight window.
// The 20 s figure in AC-10 is a duration target for the reference machine; the
// measured QUANTITY (sustained 30 Hz, ≤ 5 % drops) is what this test gates, and
// it is measured over the longest window the unmodified item allows.
//
// REAL Pyodide is required; the test SKIPS GRACEFULLY when jsDelivr is
// unreachable (see py-helpers). It runs for real in CI.

import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { PYODIDE_READY_TIMEOUT, logBrowserDiagnostics, skipUnlessPyodideReachable } from './py-helpers';

const MODULE_ID = 'kinematics-suvat';
const LESSON_ID = 'projectiles';
const ITEM_ID = 'items/projectile';

const TARGET_HZ = 30;
const TOLERANCE = 0.05; // ≤ 5 % missed ticks (AC-10 / NFR-PY-004).
const MIN_HZ = TARGET_HZ * (1 - TOLERANCE); // 28.5 Hz

test.describe('@py AC-10 projectile sustains 30 Hz ticks (real Pyodide)', () => {
  test.beforeEach(async () => {
    await skipUnlessPyodideReachable();
  });

  test('@py AC-10: 6.13(b) sustains 30 Hz with ≤ 5 % missed ticks over the flight', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    logBrowserDiagnostics(page, 'AC-10');

    await page.goto(`/#/module/${MODULE_ID}/lesson/${LESSON_ID}`);
    const item = page.locator(`[data-py-item="${ITEM_ID}"]`);
    await item.scrollIntoViewIfNeeded();

    await expect(item.getByRole('img', { name: 'Interactive canvas' })).toBeVisible({
      timeout: PYODIDE_READY_TIMEOUT,
    });

    // Configure the longest achievable flight: max angle + max speed sliders.
    await setSliderMax(item, 'Angle (°)');
    await setSliderMax(item, 'Speed (m/s)');

    await item.getByRole('button', { name: 'Launch' }).click();

    // Sample sim_time on every animation frame in the page, counting distinct
    // values (== applied ticks) until the sim pauses (sim_time stops advancing)
    // or a hard ceiling is reached. Returns {distinct, wallMs, simSpan}.
    const measured = await measureTickCadence(page, ITEM_ID);

    // Need a meaningful window (several seconds of flight) to judge cadence.
    expect(measured.wallMs, 'measured a multi-second flight window').toBeGreaterThan(2_000);
    expect(measured.distinct, 'ticks were applied').toBeGreaterThan(30);

    const wallSeconds = measured.wallMs / 1000;
    const effectiveHz = measured.distinct / wallSeconds;

    // AC-10 / NFR-PY-004: sustained ≥ 28.5 Hz (≤ 5 % missed ticks). Allow a
    // small ceiling above 30 for rAF jitter (host clamps the cadence to 30 Hz).
    expect(effectiveHz, `effective tick rate ${effectiveHz.toFixed(1)} Hz`).toBeGreaterThanOrEqual(
      MIN_HZ,
    );
    expect(effectiveHz, `effective tick rate ${effectiveHz.toFixed(1)} Hz`).toBeLessThanOrEqual(
      TARGET_HZ * 1.15,
    );

    // sim_time advanced ≈ wall time within 5 % (integrator keeps pace).
    const ratio = measured.simSpan / wallSeconds;
    expect(ratio, `sim_time/wall ratio ${ratio.toFixed(3)}`).toBeGreaterThan(1 - TOLERANCE);
    expect(ratio, `sim_time/wall ratio ${ratio.toFixed(3)}`).toBeLessThan(1 + TOLERANCE);
  });
});

/** Drag a labelled Slider to its maximum via the keyboard (End key). */
async function setSliderMax(item: Locator, label: string): Promise<void> {
  const slider = item.getByRole('slider', { name: new RegExp(label.replace(/[()]/g, '\\$&')) });
  await slider.focus();
  await slider.press('End');
}

interface Cadence {
  distinct: number;
  wallMs: number;
  simSpan: number;
}

/**
 * In-page sampler: read the projectile's `t = X.XX s` readout on every
 * animation frame, recording each distinct sim_time value with its wall
 * timestamp. Stops when sim_time has not changed for ~500 ms (landed/paused) or
 * after a 12 s safety ceiling. Returns the distinct-tick count, the wall window
 * spanned by those ticks, and the sim_time span covered.
 */
function measureTickCadence(page: Page, itemId: string): Promise<Cadence> {
  return page.evaluate(
    ({ itemId, ceilingMs, idleMs }) =>
      new Promise<Cadence>((resolve) => {
        const root = document.querySelector(`[data-py-item="${itemId}"]`);
        const readSim = (): number | null => {
          const text = (root?.textContent ?? '').replace(/\s+/g, ' ');
          const m = /t\s*=\s*([\d.]+)\s*s/i.exec(text);
          return m ? Number(m[1]) : null;
        };

        const samples: { sim: number; at: number }[] = [];
        let lastSim: number | null = null;
        let lastChange = performance.now();
        const start = performance.now();

        const tick = () => {
          const now = performance.now();
          const sim = readSim();
          if (sim !== null && sim !== lastSim) {
            samples.push({ sim, at: now });
            lastSim = sim;
            lastChange = now;
          }
          const idle = now - lastChange;
          // Stop once it has been idle for a while AND we have a real window,
          // or at the safety ceiling.
          if ((samples.length > 5 && idle > idleMs) || now - start > ceilingMs) {
            const first = samples[0];
            const last = samples[samples.length - 1];
            resolve({
              distinct: samples.length,
              wallMs: first && last ? last.at - first.at : 0,
              simSpan: first && last ? last.sim - first.sim : 0,
            });
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    { itemId, ceilingMs: 12_000, idleMs: 500 },
  );
}
