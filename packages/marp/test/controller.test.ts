import { __setDiagnosticSink } from '@silverpoint/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { initialMachine, reduce, type DeckAction, type Machine } from '../src/controller/reduce';

/* The deck controller's reducer (T-267, DD-057, API delta §7.2, Data Model §2.35). */

let sunk: string[] = [];
let restore: () => void;
beforeEach(() => {
  sunk = [];
  restore = __setDiagnosticSink((code, message) => sunk.push(`${code} ${message}`));
});
afterEach(() => restore());

const STEPS = [0, 2, 1, 0];
const at = (page: number, step: number, options: { controlled?: boolean } = {}): Machine => {
  const m = initialMachine({ total: STEPS.length, steps: STEPS, ...(options.controlled ? { page } : { defaultPage: page }) }).machine;
  return { ...m, state: { ...m.state, step } };
};
const run = (m: Machine, action: DeckAction) => reduce(m, action);
const pos = (m: Machine) => [m.state.page, m.state.step];

describe('initial state (REQ-598, REQ-599)', () => {
  test('REQ-598 · uncontrolled from defaultPage (default 1), controlled from page; 1-based', () => {
    expect(initialMachine({ total: 4, steps: STEPS }).machine.state).toEqual({ page: 1, step: 0, total: 4, steps: STEPS, overview: false, notes: false, fullscreen: false, controlled: false });
    expect(initialMachine({ total: 4, steps: STEPS, defaultPage: 3 }).machine.state).toMatchObject({ page: 3, controlled: false });
    expect(initialMachine({ total: 4, steps: STEPS, page: 2 }).machine.state).toMatchObject({ page: 2, controlled: true });
  });

  test.each([[0, 1], [-3, 1], [9, 4], [2.6, 3], [Number.NaN, 1]])('REQ-599 · page %s is clamped to %s and raises SP028', (page, clamped) => {
    const { machine, clamped: c } = initialMachine({ total: 4, steps: STEPS, defaultPage: page });
    expect(machine.state.page).toBe(clamped);
    expect(c).toEqual({ requested: page, page: clamped });
  });

  test('REQ-599 · an in-range page raises nothing', () => {
    expect(initialMachine({ total: 4, steps: STEPS, defaultPage: 4 }).clamped).toBeUndefined();
  });

  test('a steps array of the wrong length or with bad counts is normalised to the total', () => {
    expect(initialMachine({ total: 3, steps: [1, -2] }).machine.state.steps).toEqual([1, 0, 0]);
    expect(initialMachine({ total: 2, steps: [1.7, 3, 9] }).machine.state.steps).toEqual([1, 3]);
    expect(initialMachine({ total: 0, steps: [] }).machine.state).toMatchObject({ total: 1, steps: [0], page: 1 });
  });
});

describe('the transitions of API §7.2 (REQ-596)', () => {
  const rows: [string, Machine, DeckAction, [number, number], string[]][] = [
    ['p, s < steps[p] · next', at(2, 0), { type: 'next' }, [2, 1], ['fragmentChange']],
    ['p < total, s = steps[p] · next', at(2, 2), { type: 'next' }, [3, 0], ['pageChange', 'fragmentChange']],
    ['p = total, s = steps[p] · next', at(4, 0), { type: 'next' }, [4, 0], []],
    ['p, s > 0 · prev', at(2, 2), { type: 'prev' }, [2, 1], ['fragmentChange']],
    ['p > 1, s = 0 · prev', at(3, 0), { type: 'prev' }, [2, 2], ['pageChange', 'fragmentChange']],
    ['p = 1, s = 0 · prev', at(1, 0), { type: 'prev' }, [1, 0], []],
    ['goTo(q)', at(1, 0), { type: 'goTo', page: 2 }, [2, 0], ['pageChange', 'fragmentChange']],
    ['goTo(q, all)', at(1, 0), { type: 'goTo', page: 2, step: 'all' }, [2, 2], ['pageChange', 'fragmentChange']],
    ['goTo(q, s)', at(1, 0), { type: 'goTo', page: 2, step: 1 }, [2, 1], ['pageChange', 'fragmentChange']],
    ['goTo(q, s > steps) clamps the step', at(1, 0), { type: 'goTo', page: 2, step: 9 }, [2, 2], ['pageChange', 'fragmentChange']],
    ['goTo(> total) clamps', at(1, 0), { type: 'goTo', page: 40 }, [4, 0], ['pageChange', 'fragmentChange']],
    ['goTo(< 1) clamps', at(3, 0), { type: 'goTo', page: -1 }, [1, 0], ['pageChange', 'fragmentChange']],
    ['goTo(current, s) moves the step only', at(2, 0), { type: 'goTo', page: 2, step: 2 }, [2, 2], ['fragmentChange']],
    ['goTo(current) at the same step', at(2, 0), { type: 'goTo', page: 2 }, [2, 0], []],
    ['first', at(3, 1), { type: 'first' }, [1, 0], ['pageChange', 'fragmentChange']],
    ['last', at(1, 0), { type: 'last' }, [4, 0], ['pageChange', 'fragmentChange']],
    ['setTotal(t ≥ p) keeps p, clamps s', at(2, 2), { type: 'setTotal', total: 3, steps: [0, 1, 0] }, [2, 1], ['ready', 'fragmentChange']],
    ['setTotal(t < p) clamps p', at(4, 0), { type: 'setTotal', total: 2, steps: [0, 2] }, [2, 0], ['ready', 'pageChange', 'fragmentChange']],
    ['setTotal(same total) is not ready', at(2, 1), { type: 'setTotal', total: 4, steps: STEPS }, [2, 1], []],
  ];

  test.each(rows)('REQ-596 · %s', (_, from, action, to, events) => {
    const { machine, events: out } = run(from, action);
    expect(pos(machine)).toEqual(to);
    expect(out.map((e) => e.type)).toEqual(events);
  });

  test('REQ-596 · the payloads carry the new position (Data Model §2.35)', () => {
    expect(run(at(2, 2), { type: 'next' }).events).toEqual([
      { type: 'pageChange', payload: { page: 3, total: 4 } },
      { type: 'fragmentChange', payload: { page: 3, step: 0, steps: 1 } },
    ]);
    expect(run(at(4, 0), { type: 'setTotal', total: 2, steps: [0, 2] }).events[0]).toEqual({ type: 'ready', payload: { total: 2 } });
  });

  test('REQ-599 · setTotal under the current page raises SP028; goTo out of range does not', () => {
    expect(run(at(4, 0), { type: 'setTotal', total: 2, steps: [0, 2] }).clamped).toEqual({ requested: 4, page: 2 });
    expect(run(at(1, 0), { type: 'goTo', page: 40 }).clamped).toBeUndefined();
  });

  test('a state that did not change is the same object', () => {
    const m = at(4, 0);
    expect(run(m, { type: 'next' }).machine).toBe(m);
  });

  test.each(['overview', 'notes', 'fullscreen'] as const)('REQ-595 · toggle %s flips, or takes force; no public event', (what) => {
    const on = run(at(1, 0), { type: 'toggle', what });
    expect(on.machine.state[what]).toBe(true);
    expect(run(on.machine, { type: 'toggle', what }).machine.state[what]).toBe(false);
    expect(run(on.machine, { type: 'toggle', what, force: true }).machine).toBe(on.machine);
    expect(on.events).toEqual([]);
  });
});

describe('controlled mode (REQ-598, Data Model §2.35)', () => {
  test('REQ-598 · a page move emits pageChange with the requested page and waits for the parent', () => {
    const { machine, events } = run(at(2, 2, { controlled: true }), { type: 'next' });
    expect(pos(machine)).toEqual([2, 2]);
    expect(events).toEqual([{ type: 'pageChange', payload: { page: 3, total: 4 } }]);
    expect(machine.pending).toEqual({ page: 3, step: 0 });
  });

  test('REQ-596 · prev into a slide keeps the step pending; the parent’s confirmation lands it fully revealed', () => {
    const asked = run(at(3, 0, { controlled: true }), { type: 'prev' }).machine;
    expect(asked.pending).toEqual({ page: 2, step: 2 });
    const { machine, events } = run(asked, { type: 'setControlledPage', page: 2 });
    expect(pos(machine)).toEqual([2, 2]);
    expect(machine.pending).toBeNull();
    expect(events).toEqual([{ type: 'fragmentChange', payload: { page: 2, step: 2, steps: 2 } }]);
  });

  test('REQ-598 · a parent page other than the pending one lands at step 0, and echoes no pageChange', () => {
    const asked = run(at(3, 0, { controlled: true }), { type: 'prev' }).machine;
    const { machine, events } = run(asked, { type: 'setControlledPage', page: 4 });
    expect(pos(machine)).toEqual([4, 0]);
    expect(events.map((e) => e.type)).toEqual(['fragmentChange']);
  });

  test('REQ-598 · fragment steps stay internal', () => {
    const { machine, events } = run(at(2, 0, { controlled: true }), { type: 'next' });
    expect(pos(machine)).toEqual([2, 1]);
    expect(events.map((e) => e.type)).toEqual(['fragmentChange']);
  });

  test('REQ-599 · setControlledPage out of range clamps and raises SP028', () => {
    const r = run(at(1, 0, { controlled: true }), { type: 'setControlledPage', page: 12 });
    expect(pos(r.machine)).toEqual([4, 0]);
    expect(r.clamped).toEqual({ requested: 12, page: 4 });
  });

  test('setControlledPage on the current page changes nothing; uncontrolled ignores it', () => {
    const m = at(2, 1, { controlled: true });
    expect(run(m, { type: 'setControlledPage', page: 2 }).machine).toBe(m);
    const u = at(2, 1);
    expect(run(u, { type: 'setControlledPage', page: 3 }).machine).toBe(u);
  });
});

/* Property tests: a seeded generator, so a failure replays (Art. 4 holds in tests as on the render path). */
function generator(seed: number) {
  let a = seed >>> 0;
  return (n: number) => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) % n);
  };
}

function randomAction(pick: (n: number) => number): DeckAction {
  switch (pick(9)) {
    case 0: case 1: case 2: return { type: 'next' };
    case 3: case 4: return { type: 'prev' };
    case 5: return { type: 'goTo', page: pick(14) - 3, ...(pick(2) ? { step: pick(3) ? pick(6) - 1 : 'all' } : {}) };
    case 6: return pick(2) ? { type: 'first' } : { type: 'last' };
    case 7: {
      const total = pick(8) + 1;
      return { type: 'setTotal', total, steps: Array.from({ length: total }, () => pick(4)) };
    }
    default: return { type: 'setControlledPage', page: pick(12) - 2 };
  }
}

const valid = (m: Machine) => {
  const { page, step, total, steps } = m.state;
  return Number.isInteger(page) && page >= 1 && page <= total && Number.isInteger(step) && step >= 0 && step <= steps[page - 1]! && steps.length === total;
};

describe('properties (I-49, I-50)', () => {
  test.each([false, true])('I-49 · page and step stay in range after 2,000 random actions (controlled: %s)', (controlled) => {
    for (let seed = 1; seed <= 20; seed++) {
      const pick = generator(seed);
      let m = initialMachine({ total: 5, steps: [1, 0, 3, 2, 0], ...(controlled ? { page: 2 } : {}) }).machine;
      for (let i = 0; i < 100; i++) {
        const action = randomAction(pick);
        m = reduce(m, action).machine;
        if (m.pending && controlled && pick(2)) m = reduce(m, { type: 'setControlledPage', page: m.pending.page }).machine;
        expect(valid(m), `seed ${seed}, action ${i}: ${JSON.stringify(action)} → ${JSON.stringify(m.state)}`).toBe(true);
      }
    }
  });

  test('I-50 · next then prev returns to the same (page, step) wherever next moves', () => {
    let checked = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const pick = generator(seed);
      const total = pick(6) + 1;
      const steps = Array.from({ length: total }, () => pick(4));
      let m = initialMachine({ total, steps }).machine;
      for (let i = 0; i < 50; i++) {
        m = reduce(m, randomAction(pick)).machine;
        const { page, step } = m.state;
        if (!(step < m.state.steps[page - 1]! || page < m.state.total)) continue;
        const back = reduce(reduce(m, { type: 'next' }).machine, { type: 'prev' }).machine;
        expect(pos(back)).toEqual([page, step]);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(500);
  });

  test('I-50 · in controlled mode too, once the parent confirms each page', () => {
    const confirm = (m: Machine) => (m.pending ? reduce(m, { type: 'setControlledPage', page: m.pending.page }).machine : m);
    for (let page = 1; page <= 4; page++) {
      for (let step = 0; step <= STEPS[page - 1]!; step++) {
        const m = at(page, step, { controlled: true });
        if (page === 4 && step === STEPS[3]) continue;
        expect(pos(confirm(reduce(confirm(reduce(m, { type: 'next' }).machine), { type: 'prev' }).machine))).toEqual([page, step]);
      }
    }
  });
});

test('SP028 is not raised by the reducer itself (it is pure): it reports, the controller diagnoses', () => {
  initialMachine({ total: 4, steps: STEPS, defaultPage: 9 });
  run(at(4, 0), { type: 'setTotal', total: 1, steps: [0] });
  expect(sunk).toEqual([]);
});
