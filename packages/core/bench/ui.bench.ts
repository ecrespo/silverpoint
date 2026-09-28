import { test } from 'vitest';
import { uiFrameVariant, uiProgressArc, uiRovingKey, uiSteps, uiValue } from '../src/ui';

/**
 * PRD delta §7, feature-002: a keyboard transition in the core < 0.05 ms, and nothing a component
 * computes costs more. Reported nightly by `tools/bench-report`; nothing here fails on time.
 */
const disabled = [false, true, false, false, true, false, false, false, false, false, false, true];
const steps = ['install', 'import', 'configure', 'publish'].map((key) => ({ key, title: key }));

const CASES: Record<string, () => unknown> = {
  uiRovingKey: () => uiRovingKey({ index: 11, count: 12, disabled }, 'ArrowRight', 'horizontal', 'rtl'),
  uiValue: () => uiValue(37.5, { min: 0, max: 100, step: 0.5 }),
  uiProgressArc: () => uiProgressArc(0.72, 8),
  uiSteps: () => uiSteps(steps, 2),
  uiFrameVariant: () => uiFrameVariant(undefined, 'dashboard--segmented-period', 4),
};

for (const [name, run] of Object.entries(CASES)) {
  test(`feature-002 · ${name} per call`, async ({ bench }) => {
    await bench(`ui · ${name}`, run).run();
  });
}
