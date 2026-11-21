/** T-310 · the forbidden-API scan over the embed's build output (REQ-644, I-57). */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { scan, scanDirectory } from './no-network.mjs';

describe('no-network', () => {
  test.each([
    ['fetch', 'a=fetch("/x")'],
    ['fetch', 'window.fetch(u)'],
    ['XMLHttpRequest', 'new XMLHttpRequest'],
    ['WebSocket', 'new WebSocket(u)'],
    ['EventSource', 'new EventSource(u)'],
    ['sendBeacon', 'navigator.sendBeacon(u)'],
    ['dynamic import', 'import("./x.js")'],
    ['eval', 'eval(code)'],
    ['eval', 'window.eval(code)'],
    ['new Function', 'new Function("return 1")'],
    ['document.cookie', 'document.cookie="a=1"'],
    ['localStorage', 'localStorage.setItem(k,v)'],
    ['sessionStorage', 'sessionStorage.x'],
    ['indexedDB', 'indexedDB.open(n)'],
    ['importScripts', 'importScripts(u)'],
  ])('REQ-644 · %s is found in %s', (name, code) => {
    expect(scan(code)).toContain(name);
  });

  test.each(['const prefetch = 1; refetch(x)', 'evaluate(x); medieval(1)', 'importance(1)', 'a.functional'])('REQ-644 · a word that only contains a name passes: %s', (code) => {
    expect(scan(code)).toEqual([]);
  });

  test('I-57 · a directory scan reports each hit with its file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'no-network-'));
    writeFileSync(join(dir, 'clean.js'), 'export const a = 1;');
    writeFileSync(join(dir, 'dirty.mjs'), 'export const b = () => fetch("/x");');
    expect(scanDirectory(dir)).toEqual([`${join(dir, 'dirty.mjs')}: fetch`]);
  });
});
