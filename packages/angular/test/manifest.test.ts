import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/**
 * TD §10 supports Angular 21 and 22, "the two most recent majors" (PRD §6). The peer range must
 * admit both, or a fresh Angular 22 app cannot install the adapter — found by the quickstart run
 * (T-098), where `npm install` refused it.
 */
describe('peer range', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { peerDependencies: Record<string, string> };

  test.each(['@angular/core', '@angular/common'])('PRD §6 · %s admits Angular 21 and 22, and nothing newer', (name) => {
    expect(manifest.peerDependencies[name]).toBe('>=21.0.0 <23.0.0');
  });
});
