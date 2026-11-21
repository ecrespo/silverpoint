/**
 * `specFromTable` (REQ-656, DD-067): a chart, a table, a mapping of roles to columns, options and
 * an appearance → the `ChartSpec` that binds them. It binds and does not query: the host's query
 * aggregated, sorted and filtered. Only mapped columns travel, under their own names; `Date` cells
 * become ISO strings; `null` and `undefined` cells become `null`. The result is validated, so a host
 * meets one error shape.
 */
import { closest } from '../util/closest';
import type { ChartSpec, SpecResult } from '../spec/types';
import { validateSpec } from '../spec/validate';
import { BINDINGS } from './bindings.generated';
import { firstRowValue, toMatrix } from './reshape';
import type { Table, TableBinding } from './types';

type Row = Record<string, unknown>;
const fail = (error: Extract<SpecResult<ChartSpec>, { ok: false }>['error']): SpecResult<ChartSpec> => ({ ok: false, error, diagnostics: [] });
const shape = (message: string): SpecResult<ChartSpec> => fail({ kind: 'shape', message });

/** The table as rows and its columns in first-seen order, or the reason it is malformed. */
function readTable(table: Table): { rows: Row[]; columns: string[] } | string {
  if ('columns' in table) {
    if (new Set(table.columns).size !== table.columns.length) return `The table repeats a column name: ${table.columns.filter((c, i) => table.columns.indexOf(c) !== i).map((c) => `"${c}"`).join(', ')}.`;
    return { rows: table.values.map((values) => Object.fromEntries(table.columns.map((c, j) => [c, values[j]]))), columns: [...table.columns] };
  }
  if (!Array.isArray(table.rows)) return 'The table must give `rows` or `columns` and `values`.';
  const columns: string[] = [];
  for (const row of table.rows) for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key);
  return { rows: table.rows as Row[], columns };
}

const cell = (value: unknown): unknown => (value instanceof Date ? value.toISOString() : value === undefined ? null : value);

export function specFromTable(binding: TableBinding): SpecResult<ChartSpec> {
  const chart = Object.prototype.hasOwnProperty.call(BINDINGS, binding.chart) ? BINDINGS[binding.chart] : undefined;
  if (!chart) return fail({ kind: 'chart', chart: binding.chart, suggestions: closest(binding.chart, Object.keys(BINDINGS)) });
  if (chart.binding === 'none') return shape(`${binding.chart} is not fed from a table: ${chart.reason ?? 'it has no binding'}`);

  const table = readTable(binding.table);
  if (typeof table === 'string') return shape(table);

  const known = chart.roles.map((r) => r.id);
  const strange = Object.keys(binding.roles).filter((id) => !known.includes(id));
  if (strange.length > 0) return shape(`${binding.chart} has no role ${strange.map((r) => `"${r}"`).join(', ')}; its roles are ${known.map((r) => `"${r}"`).join(', ')}.`);

  const mapped = new Map<string, string[]>();
  for (const role of chart.roles) {
    const given = binding.roles[role.id];
    if (given === undefined || (Array.isArray(given) && given.length === 0)) continue;
    mapped.set(role.id, typeof given === 'string' ? [given] : [...given]);
  }
  const missing = chart.roles.filter((r) => r.required && !mapped.has(r.id)).map((r) => r.id);
  const unknownColumns = [...new Set([...mapped.values()].flat())].filter((c) => !table.columns.includes(c));
  if (missing.length > 0 || unknownColumns.length > 0) return fail({ kind: 'role', missing, unknownColumns });

  const names = [...new Set([...mapped.values()].flat())];
  const rows = table.rows.map((row) => Object.fromEntries(names.map((name) => [name, cell(row[name])])));
  const props: Record<string, unknown> = { ...binding.options };
  let data: unknown;

  if (chart.reshape === 'matrix') {
    const [row, column, value] = ['row', 'column', 'value'].map((id) => mapped.get(id)![0]!);
    const matrix = toMatrix(rows, row!, column!, value!);
    data = matrix.data;
    Object.assign(props, { labelKey: row, valuesKey: matrix.valuesKey, columnLabels: matrix.columnLabels });
  } else if (chart.reshape === 'first-row') {
    const role = chart.roles[0]!;
    const value = firstRowValue(rows, mapped.get(role.id)![0]!);
    if (value === undefined) return shape(`${binding.chart} draws one value from the table's first row, and the table has no number there.`);
    props[role.id] = value;
  } else {
    data = rows;
    for (const role of chart.roles) {
      const columns = mapped.get(role.id);
      if (!columns || role.prop === null) continue;
      props[role.prop] = role.multiple ? columns : columns[0];
    }
  }

  const spec: Record<string, unknown> = {
    chart: binding.chart,
    ...(data === undefined ? {} : { data }),
    props,
    ...binding.appearance,
    ...binding.size,
    ...(binding.id === undefined ? {} : { id: binding.id }),
  };
  for (const key of Object.keys(spec)) if (spec[key] === undefined) delete spec[key];
  return validateSpec(spec);
}
