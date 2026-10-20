/**
 * The inputs of `generate_code`'s golden files (REQ-541, REQ-557): the generator test writes each
 * one's code to `golden/<file>`, and the type-check tool compiles them in the example apps.
 */
import type { GenerateInput } from '../src/codegen';

export interface GoldenCase {
  readonly file: string;
  readonly input: GenerateInput;
}

const FRAMEWORKS = [
  ['react', 'tsx'],
  ['vue', 'vue'],
  ['angular', 'ts'],
  ['reflex', 'py'],
] as const;

const per = (name: string, input: Omit<GenerateInput, 'framework'>): GoldenCase[] =>
  FRAMEWORKS.map(([framework, ext]) => ({ file: `${framework}/${name}.${ext}`, input: { ...input, framework } }));

export const GOLDEN_CASES: readonly GoldenCase[] = [
  ...per('sankey-chart', {
    target: { chart: 'sankey-chart' },
    fields: { source: 'from', target: 'to', value: 'count' },
    props: { title: 'Signup flow', height: 240 },
    ground: 'cyanotype',
    substrate: 'prussian',
  }),
  ...per('stream-chart', { target: { chart: 'stream-chart' }, fields: { x: 'day', values: ['hits', 'misses'] }, palette: 'sanguine', mode: 'precision' }),
  ...per('treemap-chart', { target: { chart: 'treemap-chart' }, fields: { label: 'folder', share: 'bytes' } }),
  ...per('select', { target: { component: 'select' } }),
  ...per('modal', { target: { component: 'modal' } }),
  ...per('tabs', { target: { component: 'tabs' }, palette: 'verdigris' }),
  ...per('switch', { target: { component: 'switch' } }),
  ...per('dropdown-menu', { target: { component: 'dropdown-menu' } }),
  ...per('toast', { target: { component: 'toast' } }),
  ...per('card', { target: { component: 'card' } }),
];
