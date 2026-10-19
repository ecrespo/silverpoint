import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';
import * as core from '../src';
import * as ui from '../src/ui';
import { UI_COMPONENTS } from '../src/ui';
import pkg from '../package.json';

/** PRD delta §6.11, the catalog: 17 components in five groups. */
const GROUPS = {
  actions: ['Button'],
  'data-entry': ['Input', 'Checkbox', 'RadioGroup', 'Switch', 'Slider', 'Rate', 'Segmented'],
  navigation: ['Tabs', 'Steps'],
  'data-display': ['Card', 'Tag', 'Badge', 'Divider'],
  feedback: ['Progress', 'Alert', 'Skeleton'],
} as const;

/** The 0.3.0 rows: the family the gates of feature-002 iterate. */
const UI_FAMILY = UI_COMPONENTS.filter((c) => c.family === 'ui');

/** Data Model delta §5: the 21 rows of feature-004, their family, group, batch and states. */
const NEW_ROWS = [
  ['Surface', 'composed', 'building-blocks', 'A1', ['frame-card', 'tone-2']],
  ['Glyph', 'composed', 'building-blocks', 'A1', ['all']],
  ['Table', 'composed', 'data-display', 'A1', ['plain', 'sorted-striped', 'empty']],
  ['Pagination', 'composed', 'navigation', 'A2', ['middle', 'total']],
  ['Breadcrumb', 'composed', 'navigation', 'A1', ['three']],
  ['Avatar', 'composed', 'data-display', 'A1', ['initials', 'square', 'group']],
  ['Statistic', 'composed', 'data-display', 'A1', ['plain', 'trend-down']],
  ['Descriptions', 'composed', 'data-display', 'A1', ['bordered', 'plain']],
  ['TimelineList', 'composed', 'data-display', 'A1', ['mixed']],
  ['Collapse', 'composed', 'disclosure', 'A2', ['one-open', 'accordion-disabled']],
  ['Empty', 'composed', 'data-display', 'A1', ['plain']],
  ['Result', 'composed', 'data-display', 'A1', ['success', 'error']],
  ['Textarea', 'composed', 'data-entry', 'A2', ['count', 'invalid']],
  ['InputNumber', 'composed', 'data-entry', 'A2', ['value', 'at-min']],
  ['Modal', 'overlay', 'overlays', 'B', ['open']],
  ['Drawer', 'overlay', 'overlays', 'B', ['end-open']],
  ['Popover', 'overlay', 'overlays', 'B', ['open']],
  ['Tooltip', 'overlay', 'overlays', 'B', ['open']],
  ['Select', 'overlay', 'overlays', 'B', ['placeholder', 'open-selected']],
  ['DropdownMenu', 'overlay', 'overlays', 'B', ['open']],
  ['Toast', 'overlay', 'overlays', 'B', ['info', 'error-action']],
] as const;

describe('UI_COMPONENTS (T-135)', () => {
  test('REQ-300 · the catalog holds the 17 components of the PRD, in its groups and order', () => {
    expect(UI_FAMILY.map((c) => c.name)).toEqual(Object.values(GROUPS).flat());
    for (const [group, names] of Object.entries(GROUPS)) {
      expect(UI_FAMILY.filter((c) => c.group === group).map((c) => c.name)).toEqual(names);
    }
  });

  test('REQ-470 · the 21 rows of feature-004 follow the 17, in Data Model §5 order, with family, group, batch and states (T-208)', () => {
    expect(UI_COMPONENTS.slice(0, 17)).toEqual(UI_FAMILY);
    expect(UI_COMPONENTS.slice(17).map((c) => [c.name, c.family, c.group, c.batch, [...c.states]])).toEqual(
      NEW_ROWS.map(([name, family, group, batch, states]) => [name, family, group, batch, [...states]]),
    );
    expect(UI_COMPONENTS.slice(17).flatMap((c) => c.states)).toHaveLength(35);
    expect(UI_COMPONENTS.slice(17).map((c) => c.slug)).toContain('timeline-list');
    expect(UI_COMPONENTS.slice(17).map((c) => c.slug)).toContain('dropdown-menu');
  });

  test('REQ-300 · each row names its kebab-case subpath and its Sp-prefixed component (OQ-U2)', () => {
    const slugs = UI_COMPONENTS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(38);
    for (const c of UI_COMPONENTS) {
      expect(c.slug).toBe(c.name.replace(/[A-Z]/g, (m, i: number) => (i ? '-' : '') + m.toLowerCase()));
      expect(c.component).toBe(`Sp${c.name}`);
    }
  });

  test('REQ-300 · every row declares at least one state, 45 + 35 in all (Data Model §5)', () => {
    for (const c of UI_COMPONENTS) {
      expect(c.states.length).toBeGreaterThan(0);
      expect(new Set(c.states).size).toBe(c.states.length);
      for (const state of c.states) expect(state).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
    expect(UI_FAMILY.flatMap((c) => c.states)).toHaveLength(45);
    expect(UI_COMPONENTS.flatMap((c) => c.states)).toHaveLength(80);
  });

  test('REQ-300 · the catalog is frozen', () => {
    expect(Object.isFrozen(UI_COMPONENTS)).toBe(true);
    expect(UI_COMPONENTS.every((c) => Object.isFrozen(c) && Object.isFrozen(c.states))).toBe(true);
  });

  test('REQ-302 · the props types require what the API delta requires (compiled type test)', () => {
    const file = fileURLToPath(new URL('./types/ui-props.ts', import.meta.url));
    const program = ts.createProgram([file], {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
      types: ['node'],
    });
    const diagnostics = ts.getPreEmitDiagnostics(program).map((d) => {
      const where = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0;
      return `${where}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`;
    });
    expect(diagnostics).toEqual([]);
  }, 20_000);

  test('REQ-330 · the UI lives on `@silverpoint/core/ui`, so the charts\' entry and its budget are unchanged', () => {
    expect(Object.keys(core).filter((name) => /^(ui|UI_)/.test(name))).toEqual([]);
    expect(Object.keys(ui)).toEqual(expect.arrayContaining(['UI_COMPONENTS', 'uiValue', 'uiRovingKey', 'uiFrameVariant']));
    expect(pkg.exports['./ui']).toMatchObject({ import: './dist/ui.js', types: './dist/ui.d.ts' });
    expect(pkg.exports['./ui-demos']).toMatchObject({ import: './dist/ui-demos.js' });
  });
});
