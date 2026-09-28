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

describe('UI_COMPONENTS (T-135)', () => {
  test('REQ-300 · the catalog holds the 17 components of the PRD, in its groups and order', () => {
    expect(UI_COMPONENTS.map((c) => c.name)).toEqual(Object.values(GROUPS).flat());
    for (const [group, names] of Object.entries(GROUPS)) {
      expect(UI_COMPONENTS.filter((c) => c.group === group).map((c) => c.name)).toEqual(names);
    }
  });

  test('REQ-300 · each row names its kebab-case subpath and its Sp-prefixed component (OQ-U2)', () => {
    const slugs = UI_COMPONENTS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(17);
    for (const c of UI_COMPONENTS) {
      expect(c.slug).toBe(c.name.replace(/[A-Z]/g, (m, i: number) => (i ? '-' : '') + m.toLowerCase()));
      expect(c.component).toBe(`Sp${c.name}`);
    }
  });

  test('REQ-300 · every row declares at least one state, 45 in all (Data Model §5)', () => {
    for (const c of UI_COMPONENTS) {
      expect(c.states.length).toBeGreaterThan(0);
      expect(new Set(c.states).size).toBe(c.states.length);
      for (const state of c.states) expect(state).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
    expect(UI_COMPONENTS.flatMap((c) => c.states)).toHaveLength(45);
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
