import { afterEach, describe, expect, test } from 'vitest';
import {
  __setDiagnosticSink,
  LINE_CHART_DEMO,
  lineChart,
  type RecipeContext,
  type SpCode,
} from '../src';

let restore: () => void = () => {};
afterEach(() => restore());

function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const context: RecipeContext = {
  id: 'sp-line-chart-demo',
  width: 320,
  locale: 'en',
  emptyState: { text: 'No data', rule: true },
  domainPadding: 0.1,
};

describe('LineChart recipe', () => {
  test('REQ-060 · geometry snapshot with the demo dataset', () => {
    const model = lineChart.build(
      { title: 'Throughput per hour', badge: 'Today', value: 1284, unit: 'requests', footerLeft: '00:00', footerRight: '22:00', height: 150 },
      context,
    );
    expect(model).toMatchSnapshot();
  });

  test('REQ-060 · every stroke declares its role, and data strokes are encoding', () => {
    const { geometry } = lineChart.build({}, context);
    const encoding = geometry.strokes.filter((s) => s.role === 'encoding');
    expect(encoding.map((s) => s.part)).toEqual(['ink-secondary', 'ink', 'heighten', 'ink']);
    expect(geometry.strokes.filter((s) => s.part === 'grid' || s.part === 'rule').every((s) => s.role === 'ornament')).toBe(true);
  });

  test('REQ-093 · invoked without data it renders the demo dataset', () => {
    const model = lineChart.build({}, context);
    expect(model.table.rows).toHaveLength(LINE_CHART_DEMO.length);
    expect(model.table.columns).toEqual(['hour', 'hits', 'baseline']);
    expect(model.geometry.hitAreas).toHaveLength(LINE_CHART_DEMO.length * 2);
    expect(Object.isFrozen(LINE_CHART_DEMO)).toBe(true);
    expect(Object.isFrozen(LINE_CHART_DEMO[0])).toBe(true);
  });

  test('REQ-093 · consumer data is read through accessor keys', () => {
    const data = [
      { day: 'Mon', visits: 3 },
      { day: 'Tue', visits: 9 },
    ];
    const model = lineChart.build({ data, xKey: 'day', valueKey: (d) => d['visits'] as number }, context);
    expect(model.table.rows).toEqual([
      ['Mon', '3'],
      ['Tue', '9'],
    ]);
    expect(model.geometry.hitAreas.map((h) => h.value)).toEqual([3, 9]);
  });

  test('REQ-094 · title, badge, value, unit and footers are drawn in the card', () => {
    const { geometry } = lineChart.build(
      { title: 'T', badge: 'B', value: 12.5, unit: 'U', footerLeft: 'L', footerRight: 'R' },
      context,
    );
    const byKind = Object.fromEntries(geometry.labels.filter((l) => l.kind !== 'tick').map((l) => [l.kind + ':' + l.text, l.anchor]));
    expect(byKind).toMatchObject({ 'title:T': 'start', 'badge:B': 'end', 'value:12.5': 'start', 'unit:U': 'start', 'footer:L': 'start', 'footer:R': 'end' });
  });

  test("REQ-095 · chrome: 'bare' emits the plot area and nothing else", () => {
    const bare = lineChart.build({ chrome: 'bare', title: 'T', footerLeft: 'L', height: 150 }, context);
    const card = lineChart.build({ chrome: 'card', title: 'T', footerLeft: 'L', height: 150 }, context);
    expect(bare.geometry.viewBox).toEqual({ x: 0, y: 0, width: 320, height: 150 });
    expect(bare.geometry.labels.some((l) => l.kind === 'title' || l.kind === 'footer')).toBe(false);
    expect(card.geometry.strokes.length - bare.geometry.strokes.length).toBe(2); // frame and footer rule
    const bareEncoding = bare.geometry.strokes.filter((s) => s.role === 'encoding');
    expect(bareEncoding).toHaveLength(4);
  });

  test('REQ-007 · an empty dataset draws the empty state without axes and without throwing', () => {
    const seen = capture();
    const model = lineChart.build({ data: [] }, context);
    expect(model.status).toBe('ready');
    expect(model.geometry.strokes.filter((s) => s.part === 'grid')).toHaveLength(0);
    expect(model.geometry.strokes.filter((s) => s.role === 'encoding')).toHaveLength(0);
    expect(model.geometry.labels.find((l) => l.kind === 'empty')?.text).toBe('No data');
    expect(seen).toContain('SP001');
  });

  test('REQ-008 · a null value is omitted from the stroke and warned', () => {
    const seen = capture();
    const data = [
      { x: 'a', value: 1 },
      { x: 'b', value: null },
      { x: 'c', value: 3 },
    ];
    const gapped = lineChart.build({ data, curve: 'linear' }, context);
    const line = gapped.geometry.strokes.find((s) => s.role === 'encoding' && s.part === 'ink')?.d ?? '';
    expect(line.match(/M/g)).toHaveLength(2);
    expect(gapped.geometry.hitAreas).toHaveLength(2);
    expect(seen).toContain('SP002');

    const bridged = lineChart.build({ data, curve: 'linear', connectNulls: true }, context);
    const joined = bridged.geometry.strokes.find((s) => s.role === 'encoding' && s.part === 'ink')?.d ?? '';
    expect(joined.match(/M/g)).toHaveLength(1);
  });

  test('REQ-009 · a 0 px container defers the render and never emits NaN', () => {
    const seen = capture();
    const model = lineChart.build({}, { ...context, width: 0 });
    expect(model.status).toBe('deferred');
    expect(JSON.stringify(model)).not.toContain('NaN');
    expect(seen).toContain('SP003');

    const unmeasured = lineChart.build({}, { ...context, width: undefined });
    expect(unmeasured.status).toBe('deferred');
  });

  test('REQ-120 · the model carries an accessible name and a description of the series', () => {
    const model = lineChart.build({ title: 'Throughput' }, context);
    expect(model.name).toBe('Throughput');
    expect(model.description).toBe(
      'Throughput. Line chart of 12 hour values in 2 series; hits ranges from 11 to 88; baseline ranges from 15 to 70.',
    );
    expect(lineChart.build({ title: 'T', label: 'Named' }, context).name).toBe('Named');
  });

  test('REQ-121 · the tabular alternative formats every value', () => {
    const model = lineChart.build({ locale: 'de' }, { ...context, locale: 'de' });
    expect(model.table.rows[0]).toEqual(['00', '18', '22']);
    expect(model.ids.table).toBe('sp-line-chart-demo-table');
  });

  test('REQ-124 · no information is carried by hatch style alone', () => {
    const { geometry } = lineChart.build({}, context);
    expect(geometry.strokes.some((s) => s.tone !== undefined && s.tone > 0)).toBe(false);
    // Series are told apart by part and dash, and named in the table.
    const parts = geometry.strokes.filter((s) => s.role === 'encoding').map((s) => `${s.part}/${s.dash ?? 'solid'}`);
    expect(new Set(parts).size).toBeGreaterThan(1);
  });
});
