// TD delta §6, H-2: the hosts kit attached to each GitHub release — the four standalone files, the
// three JSON files, the renderToHTML goldens and the table fixtures, all from packages/embed/dist.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { hostsKitFiles, hostsKitName } from './hosts-kit.mjs';

const dist = join(import.meta.dirname, '../../packages/embed/dist');

describe('hosts kit', () => {
  test('is named for the version', () => {
    expect(hostsKitName('0.11.0')).toBe('silverpoint-hosts-kit-0.11.0.zip');
  });

  test.runIf(existsSync(join(dist, 'integrity.json')))('lists every file a host vendors, all present in dist', () => {
    const files = hostsKitFiles(dist);
    for (const needed of ['silverpoint-embed.js', 'silverpoint-embed.mjs', 'silverpoint-embed.full.js', 'silverpoint-embed.full.mjs', 'host-catalog.json', 'conformance.json', 'integrity.json', 'html-goldens/cases.json', 'tables/rows.json']) {
      expect(files).toContain(needed);
    }
    for (const file of files) expect(existsSync(join(dist, file)), file).toBe(true);
    expect(files.some((f) => f.endsWith('.map') || f.startsWith('chunk-'))).toBe(false);
  });
});
