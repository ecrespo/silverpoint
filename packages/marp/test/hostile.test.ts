import { describe, expect, test } from 'vitest';
import { createDeckEngine } from '../src';

/** I-45: no `<script`, no `on*=` attribute in a tag, no `javascript:`/`vbscript:` URL in the slides. */
function assertInert(html: string) {
  expect(html).not.toMatch(/<script/i);
  // Attribute names only: quoted values (where escaped text such as `&quot; onclick=` lives) are blanked.
  const tags = html.match(/<[a-z][^>]*>/gi) ?? [];
  for (const tag of tags) expect(tag.replace(/"[^"]*"/g, '""')).not.toMatch(/\son[a-z]+\s*=/i);
  expect(html).not.toMatch(/(?:href|src)\s*=\s*"\s*(?:javascript|vbscript):/i);
  expect(html).not.toMatch(/url\(\s*["']?\s*(?:javascript|vbscript):/i);
}

const CORPUS: Readonly<Record<string, string>> = {
  'raw script': '<script>alert(1)</script>',
  'raw event handler': '<img src=x onerror="alert(1)">',
  'raw iframe': '<iframe src="javascript:alert(1)"></iframe>',
  'javascript link': '[click](javascript:alert(1))',
  'vbscript link': '[click](vbscript:msgbox(1))',
  'encoded javascript link': '[click](jav&#x61;script:alert(1))',
  'javascript image': '![x](javascript:alert(1))',
  'data html link': '[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
  'data svg image': '![x](data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+)',
  'javascript background': '![bg](javascript:alert(1))',
  'javascript split background': '![bg left](javascript:alert(1))',
  'autolink': '<javascript:alert(1)>',
  'html in a comment (note)': '<!-- <script>alert(1)</script> -->',
  'html in header directive': '<!-- header: "<img src=x onerror=alert(1)>" -->',
  'javascript backgroundImage directive': '<!-- backgroundImage: "url(javascript:alert(1))" -->',
  'attribute break in class directive': '<!-- class: "a\\" onmouseover=\\"alert(1)" -->',
  // T-259: what a chart fence writes — its spec attribute, its chart's text, its error figure.
  'fence title and data': '```silverpoint\n{"chart":"bar-chart","data":[{"x":"<img src=x onerror=alert(1)>","value":1}],"props":{"title":"\\"><script>alert(1)</script>"}}\n```',
  'fence unknown chart': '```silverpoint\n{"chart":"\\" onmouseover=\\"alert(1)"}\n```',
  'fence bad json': '```silverpoint\n</figcaption><script>alert(1)</script>\n```',
};

describe('hostile input (T-255, REQ-575, I-45)', () => {
  test.each(Object.entries(CORPUS))('%s renders inert', (_, markdown) => {
    const deck = createDeckEngine({ id: 'h' }).render(`# Slide\n\n${markdown}\n`);
    for (const slide of deck.slides) assertInert(slide.html);
  });

  test('a note keeps its text: comments are data the adapters write as text, never HTML', () => {
    const deck = createDeckEngine({ id: 'h' }).render(`# Slide\n\n${CORPUS['html in a comment (note)']}`);
    expect(deck.slides[0]!.notes).toEqual(['<script>alert(1)</script>']);
  });

  test.each([
    ['an inline <style>', '<style>\nsection::after { content: "</style><script>alert(1)</script>"; }\n</style>'],
    ['the style directive', '<!-- style: "section::after { content: \\"</style><script>alert(1)</script>\\"; }" -->'],
    ['a scoped <style>', '<style scoped>\nh1::after { content: "</STYLE ><img src=x onerror=alert(1)>"; }\n</style>'],
  ])('%s cannot close the deck’s <style> element', (_, css) => {
    const deck = createDeckEngine({ id: 'h' }).render(`# Slide\n\n${css}\n`);
    expect(deck.css).not.toMatch(/<\/style/i);
    expect(deck.css).not.toContain('<');
  });

  test.each([
    ['an inline <style>', '<style>\n@import url("https://evil.example/x.css");\nh1 { color: red; }\n</style>'],
    ['the style directive', '<!-- style: "@import \\"https://evil.example/x.css\\"; h1 { color: red; }" -->'],
  ])('%s cannot @import a stylesheet from outside the deck; its own rules stay', (_, css) => {
    const deck = createDeckEngine({ id: 'h' }).render(`# Slide\n\n${css}\n`);
    expect(deck.css).not.toMatch(/@import/i);
    expect(deck.css).not.toContain('evil.example');
    expect(deck.css).toMatch(/h1[^{]*\{[^}]*color:\s*red/);
  });

  test('an author rule that only mentions @import inside a string is kept as written', () => {
    const deck = createDeckEngine({ id: 'h' }).render('# S\n\n<style>\nh1::after { content: "@import is a word"; }\n</style>\n');
    expect(deck.css).toContain('content: "@import is a word"');
  });

  test('an inline <style> cannot close the deck’s <style> element (whole-string check)', () => {
    const md = '# Slide\n\n<style>\nsection::after { content: "</style><script>alert(1)</script>"; }\n</style>\n';
    const deck = createDeckEngine({ id: 'h' }).render(md);
    expect(deck.css).not.toMatch(/<\/style/i);
    expect(deck.css).not.toMatch(/<script/i);
  });
});
