/**
 * The UI component fixtures of Data Model §5 (REQ-327, REQ-182): every declared state of every
 * gated component × 5 ground substrates × 2 modes, plus `sm` and `lg` of Button and Input. Each
 * carries its canonical render, written from the core's view alone (ui-canonical.ts).
 */
import { UI_COMPONENTS, type CommonUiProps, type UiComponentRow, type UiSize } from '@silverpoint/core/ui';
import { UI_DEMOS } from '@silverpoint/core/ui-demos';

/** Each ground with its substrates, as the chart and dashboard matrices have them. No `fs` here: adapter tests import this. */
const GROUND_SUBSTRATES = [
  ...(['cream', 'green', 'blue', 'ochre'] as const).map((substrate) => ({ ground: 'silverpoint', substrate })),
  { ground: 'cyanotype', substrate: 'prussian' },
] as const;

/** The batches of step 6c whose adapters exist; a batch joins every gate by joining this list. */
export const GATED_BATCHES: readonly UiComponentRow['batch'][] = ['B1'];
export const GATED_UI: readonly UiComponentRow[] = UI_COMPONENTS.filter((c) => GATED_BATCHES.includes(c.batch));

/** Components drawn at every size, in their first state (nightly; Data Model §5). */
const SIZED: ReadonlySet<string> = new Set(['button', 'input', 'segmented']);
/** Harness widths: 640 for the wide components, 320 for the rest. */
const WIDE: ReadonlySet<string> = new Set(['card', 'alert']);
const PR_GROUNDS = new Set(['silverpoint/cream', 'cyanotype/prussian']);

export interface UiFixture {
  /** `<component>--<state>--<ground>--<substrate>--<mode>[--<size>]`: its files' name. */
  readonly id: string;
  readonly component: string;
  readonly state: string;
  readonly req: 'REQ-327';
  readonly ground: string;
  readonly substrate: string;
  readonly mode: 'ink' | 'precision';
  readonly size: UiSize;
  /** The harness width, px. */
  readonly width: number;
  /** `pr`: compared on every PR; `nightly`: in the full run. */
  readonly scope: 'pr' | 'nightly';
  readonly canonical: string;
}

export function uiMatrix(): UiFixture[] {
  const out: UiFixture[] = [];
  for (const row of GATED_UI) {
    const sizes: UiSize[] = ['md', ...(SIZED.has(row.slug) ? (['sm', 'lg'] as const) : [])];
    for (const size of sizes) {
      for (const state of size === 'md' ? row.states : row.states.slice(0, 1)) {
        for (const { ground, substrate } of GROUND_SUBSTRATES) {
          for (const mode of ['ink', 'precision'] as const) {
            const id = [row.slug, state, ground, substrate, mode, ...(size === 'md' ? [] : [size])].join('--');
            out.push({
              id,
              component: row.slug,
              state,
              req: 'REQ-327',
              ground,
              substrate,
              mode,
              size,
              width: WIDE.has(row.slug) ? 640 : 320,
              scope: size === 'md' && PR_GROUNDS.has(`${ground}/${substrate}`) ? 'pr' : 'nightly',
              canonical: `ui/${id}.canonical.txt`,
            });
          }
        }
      }
    }
  }
  return out;
}

/** Demo keys that are content, not props: each adapter puts them in its slots. */
const SLOTS = ['content', 'extra', 'footer'] as const;
export type UiSlotText = Partial<Record<(typeof SLOTS)[number], string>>;

/**
 * What every adapter receives for a fixture: the demo's props with the fixture's ground, substrate,
 * mode and size; the value apart (each framework binds it in its own idiom); the slot text apart.
 */
export function uiFixtureParts(fixture: UiFixture): { props: CommonUiProps & Record<string, unknown>; value: unknown; slots: UiSlotText } {
  const demo = UI_DEMOS[fixture.component]?.[fixture.state];
  if (!demo) throw new Error(`No demo ${fixture.component}/${fixture.state}`);
  const props: Record<string, unknown> = {};
  const slots: UiSlotText = {};
  let value: unknown;
  for (const [key, v] of Object.entries(demo)) {
    if ((SLOTS as readonly string[]).includes(key)) slots[key as (typeof SLOTS)[number]] = v as string;
    else if (key === 'value') value = v;
    else props[key] = v;
  }
  return {
    props: { ...props, ground: fixture.ground, substrate: fixture.substrate as CommonUiProps['substrate'], mode: fixture.mode, size: fixture.size },
    value,
    slots,
  };
}
