/**
 * The reshapes of REQ-657 (API delta §15.3): a matrix from long rows, a set of dimensions from
 * columns, a single value from the first row. Pure; no aggregation, sort or filter (DD-067).
 */
type Row = Readonly<Record<string, unknown>>;

/** One output row per distinct `row`, its values in the order columns first appear; missing cells `null`. */
export function toMatrix(rows: readonly Row[], rowColumn: string, columnColumn: string, valueColumn: string): { data: Record<string, unknown>[]; valuesKey: string; columnLabels: string[] } {
  const columns: string[] = [];
  const order: string[] = [];
  const cells = new Map<string, Map<string, unknown>>();
  for (const row of rows) {
    const r = String(row[rowColumn] ?? '');
    const c = String(row[columnColumn] ?? '');
    if (!cells.has(r)) {
      cells.set(r, new Map());
      order.push(r);
    }
    if (!columns.includes(c)) columns.push(c);
    cells.get(r)!.set(c, row[valueColumn] ?? null);
  }
  const valuesKey = rowColumn === 'values' ? '__values' : 'values';
  const data = order.map((r) => ({ [rowColumn]: r, [valuesKey]: columns.map((c) => (cells.get(r)!.has(c) ? cells.get(r)!.get(c) : null)) }));
  return { data, valuesKey, columnLabels: columns };
}

/** The first row's cell as a number, or `undefined` when there is none. */
export function firstRowValue(rows: readonly Row[], column: string): number | undefined {
  const first = rows[0];
  if (!first) return undefined;
  const value = Number(first[column]);
  return Number.isFinite(value) ? value : undefined;
}
