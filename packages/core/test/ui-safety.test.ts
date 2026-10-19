import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, type SpCode } from '../src';
import { resolveUi, uiBreadcrumbView, uiButtonView, uiCardView, uiDescriptionsView, uiResultView, type UiElement, type UiNode } from '../src/ui';

/*
 * What a prop may write into markup it does not own: a link's scheme and a heading's tag. The
 * types already say so; these hold at runtime too, for JavaScript callers and untyped data
 * (REQ-486, the security review of 9f538f5).
 */

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const r = resolveUi({}, {});
const isElement = (n: UiNode): n is UiElement => 'tag' in n;
const all = (n: UiNode): UiElement[] => (isElement(n) ? [n, ...n.children.flatMap(all)] : []);
const links = (n: UiNode) => all(n).filter((e) => e.tag === 'a');

const UNSAFE = ['javascript:alert(1)', 'JavaScript:alert(1)', ' javascript:alert(1)', 'java\tscript:alert(1)', '\u0001javascript:alert(1)', 'data:text/html,<b>x</b>', 'vbscript:msgbox(1)'];
const SAFE = ['/orders', 'HTTPS://example.org/A', 'orders/1042', '#top', '?page=2', '', 'https://example.org/a', 'http://example.org', 'mailto:a@example.org', 'tel:+58212', '/a:b', './x:y'];

describe('link schemes (REQ-486)', () => {
  test('a crumb keeps a relative, http(s), mailto or tel href', () => {
    const seen = capture();
    for (const href of SAFE) {
      const view = uiBreadcrumbView({ items: [{ label: 'Up', href }, { label: 'Here' }] }, r);
      expect(links(view).map((a) => a.attrs.href), href).toEqual([href]);
    }
    expect(seen).toEqual([]);
  });

  test('a crumb drops any other scheme with SP017, and is drawn as plain text', () => {
    for (const href of UNSAFE) {
      const seen = capture();
      const view = uiBreadcrumbView({ items: [{ label: 'Up', href }, { label: 'Here' }] }, r);
      expect(links(view), JSON.stringify(href)).toEqual([]);
      expect(JSON.stringify(view)).not.toMatch(/script:|data:/i);
      expect(seen).toEqual(['SP017']);
    }
  });

  test('a link button drops an unsafe href with SP017 and is drawn as a native button', () => {
    for (const href of UNSAFE) {
      const seen = capture();
      const view = uiButtonView({ href }, r, { text: 'Go' });
      expect(view.tag, JSON.stringify(href)).toBe('button');
      expect(view.attrs.href).toBeUndefined();
      expect(seen).toEqual(['SP017']);
    }
    expect(uiButtonView({ href: 'https://example.org' }, r, { text: 'Go' }).attrs.href).toBe('https://example.org');
  });
});

describe('heading levels (REQ-486)', () => {
  const headings = (n: UiNode) => all(n).filter((e) => /^h\d$/.test(e.tag)).map((e) => e.tag);
  const views = (level: unknown) => [
    uiCardView({ title: 'T', headingLevel: level as never }, r, {}),
    uiDescriptionsView({ title: 'T', items: [], headingLevel: level as never }, r),
    uiResultView({ title: 'T', headingLevel: level as never }, r, {}),
  ];

  test('levels 2..6 are written as given; none is h3', () => {
    const seen = capture();
    for (const level of [2, 3, 4, 5, 6]) for (const view of views(level)) expect(headings(view)).toEqual([`h${level}`]);
    for (const view of views(undefined)) expect(headings(view)).toEqual(['h3']);
    expect(seen).toEqual([]);
  });

  test('any other level is h3, with SP017 — never a tag built from the value', () => {
    for (const level of [1, 7, 0, 2.5, '2', '4', '3 onclick=alert(1)', 'script', null]) {
      const seen = capture();
      for (const view of views(level)) {
        expect(headings(view), String(level)).toEqual(['h3']);
        expect(all(view).every((e) => /^[a-z][a-z0-9-]*$/.test(e.tag))).toBe(true);
      }
      expect(seen).toEqual(['SP017', 'SP017', 'SP017']);
    }
  });
});
