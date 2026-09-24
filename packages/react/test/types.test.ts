// @vitest-environment node
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

  test('REQ-104 · the server LineChart requires an explicit width and height', () => {
    const errors = typeErrors(`
      import { LineChart } from '../src/server/line-chart';
      export const a = <LineChart />;
    `);
    expect(errors.join('\n')).toMatch(/width|height/);
  }, 30_000);

  test('TD §6 · the server LineChart requires an id, since nothing can generate a unique one', () => {
    const errors = typeErrors(`
      import { LineChart } from '../src/server/line-chart';
      export const a = <LineChart width={320} height={160} />;
    `);
    expect(errors.join('\n')).toMatch(/\bid\b/);
  }, 30_000);

  test('REQ-104 · a well-formed server chart type-checks', () => {
    const errors = typeErrors(`
      import { LineChart } from '../src/server/line-chart';
      export const a = <LineChart id="sp-ok" width={320} height={160} title="Ok" />;
    `);
    expect(errors).toEqual([]);
  }, 30_000);
});
