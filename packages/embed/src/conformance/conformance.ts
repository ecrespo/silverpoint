/**
 * `conformance` (REQ-666): a host runs the declared cases through the engine it ships, in the
 * runtime it ships it in, and compares SHA-256 digests. The hash is Web Crypto's when none is given
 * (browsers, Node 20+, workers). The cases are the package's own unless the host passes the file it
 * pinned.
 */
import CASES from './conformance.json' with { type: 'json' };
import type { ChartSpec } from '../spec/types';
import type { Conformance } from './types';

export const CONFORMANCE: Conformance = CASES as Conformance;

async function webCryptoSha256(text: string): Promise<string> {
  const subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('No Web Crypto in this runtime: pass a SHA-256 function to conformance().');
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function conformance(
  render: (spec: ChartSpec) => string | Promise<string>,
  hash: (text: string) => string | Promise<string> = webCryptoSha256,
  cases: Conformance = CONFORMANCE,
): Promise<{ readonly passed: number; readonly failed: readonly { name: string; expected: string; actual: string }[] }> {
  let passed = 0;
  const failed: { name: string; expected: string; actual: string }[] = [];
  for (const c of cases.cases) {
    let actual: string;
    try {
      actual = await hash(await render(c.spec));
    } catch (error) {
      actual = `error: ${(error as Error).message}`;
    }
    if (actual === c.sha256) passed++;
    else failed.push({ name: c.name, expected: c.sha256, actual });
  }
  return { passed, failed };
}
