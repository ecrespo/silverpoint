/** T-317 · `hostCatalogFollows` and the stamps (REQ-658). */
import { describe, expect, test } from 'vitest';
import { HOST_CATALOG, hostCatalogFollows } from '../src/hosts/index';
import { VERSION } from '../src/index';

describe('hostCatalogFollows', () => {
  test.each([
    ['0.11.0', '0.11.7', true],
    ['0.11.3', '0.11.0', true],
    ['0.11.0', '0.12.0', false],
    ['0.11.0', '1.11.0', false],
    ['1.2.0', '1.2.9-next.1', true],
    ['x', '0.11.0', false],
  ])('REQ-658 · pinned %s, current %s → %s', (pinned, current, expected) => {
    expect(hostCatalogFollows(pinned, current)).toBe(expected);
  });

  test('REQ-658 · the catalog carries schema 1 and the library version', () => {
    expect(HOST_CATALOG.schema).toBe(1);
    expect(HOST_CATALOG.version).toBe(VERSION);
  });
});
