/**
 * Outer test of step 11b (tdd-plan §2): every fixture of the PR matrix, as a spec, through
 * `renderToSVG`, against its committed canonical render, as trees — the root's leading `<style>`
 * set aside and nothing else (I-53, REQ-632, DD-065).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { renderToSVG } from '../../packages/embed/src/index';
import { compareSvgTrees, parseSvg, type NormalElement } from '../svg-normalizer/normalize';
import { specOfFixture } from './embed-fixtures';
import { FIXTURES_DIR, loadFixtures } from './fixtures';
import { markupOf } from './string-gate';

const withoutStyle = (tree: NormalElement): NormalElement => {
  const [first, ...rest] = tree.children;
  return first && 'tag' in first && first.tag === 'style' ? { ...tree, children: rest } : tree;
};

const fixtures = loadFixtures('pr');

describe('embed tree gate (I-53)', () => {
  test('REQ-632 · every PR fixture has a spec form (A-04: none skipped today)', () => {
    const skipped = fixtures.filter((f) => specOfFixture(f, FIXTURES_DIR) === null).map((f) => f.id);
    expect(skipped).toEqual([]);
  });

  test('REQ-632 · renderToSVG of every PR fixture equals its canonical tree, <style> set aside', () => {
    const differ: string[] = [];
    for (const fixture of fixtures) {
      const spec = specOfFixture(fixture, FIXTURES_DIR);
      if (!spec) continue;
      const result = renderToSVG(spec);
      if (!result.ok) {
        differ.push(`${fixture.id}: ${JSON.stringify(result.error)}`);
        continue;
      }
      const expected = parseSvg(markupOf(readFileSync(join(FIXTURES_DIR, fixture.canonical), 'utf8')));
      const comparison = compareSvgTrees(withoutStyle(parseSvg(result.value.svg)), expected);
      if (!comparison.equal) differ.push(`${fixture.id}: ${comparison.difference}`);
    }
    expect(differ.slice(0, 5)).toEqual([]);
  });
});
