// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Type-checks a snippet placed inside the package, returning its diagnostics as text. */
function typeErrors(source: string): string[] {
  const file = `${root}test/__snippet__.tsx`;
  const config = ts.getParsedCommandLineOfConfigFile(`${root}tsconfig.json`, {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: () => {},
  });
  if (!config) throw new Error('tsconfig not found');
  const host = ts.createCompilerHost(config.options);
  const read = host.readFile.bind(host);
  host.readFile = (name) => (name === file ? source : read(name));
  host.fileExists = ((exists) => (name: string) => name === file || exists(name))(host.fileExists.bind(host));
  const program = ts.createProgram([file], { ...config.options, noEmit: true }, host);
  return ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file?.fileName === file)
    .map((d) => {
      const span = d.start === undefined ? '' : source.slice(d.start, d.start + (d.length ?? 0));
      return `${span}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`;
    });
}

describe('server entry types', () => {
  test('REQ-104 · the server LineChart rejects onActiveChange at the type level', () => {
    const errors = typeErrors(`
      import { LineChart } from '../src/server/line-chart';
      export const a = <LineChart id="x" width={320} height={160} onActiveChange={() => {}} />;
    `);
    expect(errors.join('\n')).toMatch(/onActiveChange/);
  }, 30_000);

  test('REQ-104 · a well-formed server chart type-checks', () => {
    const errors = typeErrors(`
      import { LineChart } from '../src/server/line-chart';
      export const a = <LineChart id="sp-ok" width={320} height={160} title="Ok" />;
    `);
    expect(errors).toEqual([]);
  }, 30_000);
});

describe('dashboard entry types (T-111)', () => {
  test('REQ-214 · a Dashboard with neither title nor label is a type error', () => {
    const errors = typeErrors(`
      import { Dashboard } from '../src/dashboard';
      export const a = <Dashboard id="ops" />;
    `);
    expect(errors.join('\n')).toMatch(/title|label/);
  }, 30_000);

  test('REQ-209 · a Dashboard without an id is a type error', () => {
    const errors = typeErrors(`
      import { Dashboard } from '../src/dashboard';
      export const a = <Dashboard title="Ops" />;
    `);
    expect(errors.join('\n')).toMatch(/\bid\b/);
  }, 30_000);

  test('REQ-219 · the server Dashboard rejects a link by type; the client one accepts it', () => {
    const server = typeErrors(`
      import { Dashboard } from '../src/server/dashboard';
      export const a = <Dashboard id="ops" title="Ops" link={{ key: 'hour' }} />;
    `);
    expect(server.join('\n')).toMatch(/link/);
    const client = typeErrors(`
      import { Dashboard, DashboardCell } from '../src/dashboard';
      import { LineChart } from '../src/line-chart';
      export const a = <Dashboard id="ops" title="Ops" link={{ key: 'hour' }}><DashboardCell cell="t"><LineChart /></DashboardCell></Dashboard>;
    `);
    expect(client).toEqual([]);
  }, 30_000);

  test('REQ-206 · inside a server Dashboard a server chart needs no id, width or height: the cell supplies them', () => {
    const errors = typeErrors(`
      import { Dashboard, DashboardCell } from '../src/server/dashboard';
      import { LineChart } from '../src/server/line-chart';
      export const a = <Dashboard id="ops" title="Ops"><DashboardCell cell="t"><LineChart title="T" /></DashboardCell></Dashboard>;
    `);
    expect(errors).toEqual([]);
  }, 30_000);

  test('REQ-104 · neither dashboard entry carries "use client": without a link there is no client boundary', () => {
    const dist = (file: string) => readFileSync(`${root}dist/${file}`, 'utf8');
    expect(dist('dashboard.js')).not.toMatch(/['"]use client['"]/);
    expect(dist('server/dashboard.js')).not.toMatch(/['"]use client['"]/);
    expect(dist('line-chart.js')).toMatch(/^['"]use client['"]/);
  });
});
