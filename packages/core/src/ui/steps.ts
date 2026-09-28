import { diagnose } from '../diagnostics/diagnose';
import { uiItems } from './items';
import type { StepItem, StepStatus } from './types';

export interface UiStep {
  readonly key: string;
  readonly status: StepStatus;
  /**
   * The connector after this step carries the status of the step it leads to, written as
   * `data-status`; a `wait` connector is dashed (C-4). `null` after the last step.
   */
  readonly connector: StepStatus | null;
}

/**
 * Status per step, derived from `current` (finish before, process at, wait after) unless the item
 * sets one, and the connectors between them. Keys are de-duplicated (`SP019`); a `current` outside
 * the list or not an integer is clamped and rounded (`SP017`, REQ-324).
 */
export function uiSteps(items: readonly StepItem[], current: number, component = 'SpSteps'): readonly UiStep[] {
  const steps = uiItems(items, component);
  if (steps.length === 0) return [];
  const last = steps.length - 1;
  const at = Number.isFinite(current) ? Math.min(Math.max(Math.round(current), 0), last) : 0;
  if (at !== current && process.env.NODE_ENV !== 'production') {
    diagnose('SP017', component, { property: 'current', message: `${current} is drawn as ${at}.` });
  }
  const statuses = steps.map((item, i): StepStatus => item.status ?? (i < at ? 'finish' : i === at ? 'process' : 'wait'));
  return steps.map((item, i) => ({ key: item.key, status: statuses[i]!, connector: i < last ? statuses[i + 1]! : null }));
}
