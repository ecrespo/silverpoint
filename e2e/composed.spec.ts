import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { COMPOSED_PAGE } from '../examples/harness/index.js';
import { APPS, type AppName } from '../playwright.config';

/**
 * Phase 8g of feature-004 (T-223): the `/composed` page of every example app, end to end. The APG
 * patterns of the overlays (Select, Menu, Modal, Drawer, Popover, Tooltip), the toaster's F8 and
 * pause, the exclusive Collapse, a native form, reduced motion, RTL, focus rings, target sizes, the
 * disabled items each pattern skips, and axe on the three pages. Firefox and WebKit run the same
 * keyboard once, against one app.
 */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const appOf = (name: string) => APPS[name as AppName];
const [INK, PRECISION] = COMPOSED_PAGE.panels;
/** An id on the silverpoint ink panel: every id on the page is prefixed by its panel (REQ-329). */
const at = (id: string) => `#${INK!.key}-${id}`;

async function open(page: Page, path = '/composed'): Promise<Locator> {
  await page.goto(path);
  if (appOf(test.info().project.name).ssr) await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  const panel = page.locator(`[data-panel="${INK!.key}"]`);
  if (path === '/composed') await expect(panel.locator('.sp-ui.sp-select').first()).toBeVisible();
  return panel;
}

const activeOption = (combobox: Locator) => combobox.getAttribute('aria-activedescendant');

/** WCAG relative luminance contrast of two `rgb(…)` colours. */
function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    if (!/^rgba?\(/.test(c)) throw new Error(`not an rgb() colour: ${c}`);
    const [r, g, bl] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => Number(v) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** axe's A and AA rules on what is drawn, then contrast alone with the frames and tones transparent (as T-159 reads them). */
async function audit(page: Page, exclude: readonly string[] = []): Promise<string[]> {
  const builder = () => exclude.reduce((b, selector) => b.exclude(selector), new AxeBuilder({ page }));
  const drawn = await builder().withTags(WCAG_AA).disableRules(['color-contrast']).analyze();
  const style = await page.addStyleTag({ content: ".sp-ui [part='sp-frame'], .sp-ui [part='sp-tone'] { background: transparent !important; }" });
  const text = await builder().withRules(['color-contrast']).analyze();
  await style.evaluate((el) => el.remove());
  return [...drawn.violations, ...text.violations].map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.describe('the overlays’ keyboard patterns (T-223)', () => {
  test('REQ-494 · REQ-498 · REQ-522 · Select: the APG select-only combobox, skipping the disabled option', async ({ page }) => {
    const panel = await open(page);
    const select = panel.locator(at('select--placeholder'));
    const combobox = select.getByRole('combobox');
    const list = select.locator('.sp-ui-select-content');
    const option = (key: string) => `${INK!.key}-select--placeholder--option-${key}`;
    await combobox.focus();
    await page.keyboard.press('ArrowDown');
    await expect(combobox).toHaveAttribute('aria-expanded', 'true');
    await expect(list).toBeVisible();
    expect(await list.evaluate((el) => el.matches(':popover-open'))).toBe(true);
    // No value: the first option is active, and heightened alone (REQ-498).
    expect(await activeOption(combobox)).toBe(option('placed'));
    await expect(list.locator("[part='sp-heighten']")).toHaveCount(1);
    await expect(list.locator(`#${option('placed')} [part='sp-heighten']`)).toHaveCount(1);
    await page.keyboard.press('ArrowDown');
    expect(await activeOption(combobox)).toBe(option('paid'));
    // End stops on the last enabled option: Returned is disabled.
    await page.keyboard.press('End');
    expect(await activeOption(combobox)).toBe(option('shipped'));
    await page.keyboard.press('ArrowDown');
    expect(await activeOption(combobox)).toBe(option('shipped'));
    await page.keyboard.press('Home');
    expect(await activeOption(combobox)).toBe(option('placed'));
    // Escape closes without choosing; focus stays on the combobox.
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await expect(combobox).toHaveAttribute('aria-expanded', 'false');
    await expect(select.locator('input[type="hidden"]')).toHaveValue('');
    await expect(combobox).toBeFocused();
    // Space opens; Enter chooses and closes.
    await page.keyboard.press('Space');
    await expect(list).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    await expect(select.locator('input[type="hidden"]')).toHaveValue('paid');
    await expect(combobox).toContainText('Paid');
    await expect(combobox).toBeFocused();
    // Reopened, the chosen option is active, selected and ticked.
    await page.keyboard.press('Enter');
    expect(await activeOption(combobox)).toBe(option('paid'));
    await expect(list.locator('[aria-selected="true"]')).toHaveCount(1);
    await expect(list.locator(`#${option('paid')}`)).toHaveAttribute('aria-selected', 'true');
    await expect(list.locator(`#${option('paid')} svg`)).toHaveCount(1);
    // Typeahead moves the active option (a Space typed within it would be a character).
    await page.keyboard.type('pac');
    expect(await activeOption(combobox)).toBe(option('packed'));
    // A disabled option takes no click.
    await list.locator(`#${option('returned')}`).click({ force: true });
    await expect(select.locator('input[type="hidden"]')).toHaveValue('paid');
    // ArrowUp opens too; a click outside dismisses (REQ-492).
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowUp');
    await expect(list).toBeVisible();
    await page.locator('h1').click();
    await expect(list).toBeHidden();
  });

  test('REQ-495 · REQ-498 · REQ-522 · Menu: the APG menu button, skipping the disabled item', async ({ page }) => {
    const panel = await open(page);
    const menu = panel.locator(at('dropdown-menu--open'));
    const trigger = menu.locator('.sp-ui-menu-trigger');
    const list = menu.getByRole('menu', { includeHidden: true });
    const item = (key: string) => menu.locator(`[role="menuitem"][data-key="${key}"]`);
    await trigger.focus();
    // Space opens on the first item; Escape closes.
    await page.keyboard.press('Space');
    await expect(list).toBeVisible();
    await expect(item('edit')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(list).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(item('edit')).toBeFocused();
    await expect(list.locator("[part='sp-heighten']")).toHaveCount(1);
    await page.keyboard.press('ArrowDown');
    await expect(item('duplicate')).toBeFocused();
    // Archive is disabled: the arrows step over it.
    await page.keyboard.press('ArrowDown');
    await expect(item('delete')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(item('edit')).toBeFocused();
    await page.keyboard.press('End');
    await expect(item('delete')).toBeFocused();
    await page.keyboard.type('d');
    await expect(item('duplicate')).toBeFocused();
    await expect(list.locator("[part='sp-heighten']")).toHaveCount(1);
    // Escape closes and returns focus to the button.
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Enter on an item activates it and closes.
    await page.keyboard.press('Enter');
    await expect(item('edit')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    await expect(trigger).toBeFocused();
    // Tab closes.
    await page.keyboard.press('Enter');
    await expect(list).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(list).toBeHidden();
  });

  for (const [component, name] of [
    ['modal--open', 'Edit order'],
    ['drawer--end-open', 'Filters'],
  ] as const) {
    test(`REQ-491 · ${name}: a modal <dialog> traps focus, makes the page inert, and Escape returns focus to its trigger`, async ({ page }) => {
      const panel = await open(page);
      const trigger = panel.getByRole('button', { name, exact: true });
      const dialog = panel.locator(`${at(component)}--dialog`);
      await trigger.click();
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      // Focus cycles through the dialog and the browser's own chrome (document.body), never the page behind.
      for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
        await page.keyboard.press(key);
        expect(await dialog.evaluate((el) => el.contains(document.activeElement) || document.activeElement === document.body), key).toBe(true);
      }
      // And it comes back: within a few Tabs focus is in the dialog again.
      let inside = false;
      for (let i = 0; i < 4 && !inside; i++) {
        await page.keyboard.press('Tab');
        inside = await dialog.evaluate((el) => el.contains(document.activeElement));
      }
      expect(inside).toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // The close button closes it too.
      await trigger.click();
      await dialog.getByRole('button', { name: 'Close' }).click();
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  }

  test('REQ-491 · the end drawer sits against the end of the viewport', async ({ page }) => {
    const panel = await open(page);
    await panel.getByRole('button', { name: 'Filters', exact: true }).click();
    const box = (await panel.locator(`${at('drawer--end-open')}--dialog`).boundingBox())!;
    expect(Math.abs(box.x + box.width - page.viewportSize()!.width)).toBeLessThanOrEqual(1);
  });

  test('REQ-492 · REQ-493 · Popover: in the top layer, placed by its trigger; Escape and a click outside close it, focus returns', async ({ page }) => {
    const panel = await open(page);
    const trigger = panel.getByRole('button', { name: 'Details', exact: true });
    const popover = panel.locator(`${at('popover--open')}--popover`);
    await trigger.click();
    await expect(popover).toBeVisible();
    expect(await popover.evaluate((el) => el.matches(':popover-open'))).toBe(true);
    await expect(popover).toHaveAttribute('data-side', /^(top|bottom|left|right)$/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Placed below, centred on its trigger: its defaults (REQ-493).
    const [t, p] = [(await trigger.boundingBox())!, (await popover.boundingBox())!];
    expect(Math.abs(p.x + p.width / 2 - (t.x + t.width / 2))).toBeLessThanOrEqual(1);
    expect(p.y).toBeGreaterThanOrEqual(t.y + t.height);
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(popover).toBeVisible();
    await page.locator('h1').click();
    await expect(popover).toBeHidden();
  });

  test('REQ-496 · Tooltip: shown on hover and on focus, kept over itself, hidden on Escape, leave and blur (WCAG 1.4.13)', async ({ page }) => {
    const panel = await open(page);
    const trigger = panel.getByRole('button', { name: 'Copy id', exact: true });
    const tooltip = panel.locator(`${at('tooltip--open')}--tooltip`);
    await expect(trigger).toHaveAttribute('aria-describedby', `${INK!.key}-tooltip--open--tooltip`);
    await expect(tooltip).toHaveAttribute('popover', 'manual');
    await trigger.hover();
    await expect(tooltip).toBeVisible();
    // Hoverable: the pointer moves onto the tooltip and it stays.
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    // Dismissable: Escape hides it without moving the pointer.
    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
    await page.mouse.move(0, 0);
    await trigger.focus();
    await expect(tooltip).toBeVisible();
    await page.locator('h1').click();
    await expect(tooltip).toBeHidden();
    await trigger.hover();
    await expect(tooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
  });
});

test.describe('the toaster (T-223)', () => {
  test('REQ-497 · toasts are announced by kind and close after their duration, unless the pointer or focus is in them', async ({ page }) => {
    await page.clock.install();
    await open(page);
    const region = page.getByRole('region', { name: `Notifications · ${INK!.title}` });
    await expect(region).toHaveCount(1);
    const info = region.locator('.sp-toast[data-kind="info"]');
    const error = region.locator('.sp-toast[data-kind="error"]');
    await expect(info.getByRole('status')).toHaveCount(1);
    await expect(error.getByRole('alert')).toHaveCount(1);
    // One held by the pointer, one (on the precision panel) by focus.
    const held = page.locator(`#${PRECISION!.key}-toaster .sp-toast[data-kind="info"]`);
    await held.getByRole('button', { name: 'Dismiss' }).focus();
    await info.hover();
    await page.clock.fastForward(6000);
    await expect(info).toBeVisible();
    await expect(held).toBeVisible();
    await expect(error).toBeHidden();
    // Once both have left, the whole duration runs again.
    await page.mouse.move(0, 0);
    await page.locator('h1').click();
    await page.clock.fastForward(4000);
    await expect(info).toBeVisible();
    await page.clock.fastForward(2000);
    await expect(info).toBeHidden();
    await expect(held).toBeHidden();
  });

  test('REQ-497 · F8 moves focus to a toaster, which is focusable only once asked', async ({ page, request }, info) => {
    if (appOf(info.project.name).ssr) {
      const html = await (await request.get('/composed')).text();
      const opening = html.match(/<section[^>]*class="sp-ui sp-toaster[^>]*>/g) ?? [];
      expect(opening).toHaveLength(COMPOSED_PAGE.panels.length);
      for (const tag of opening) expect(tag).not.toContain('tabindex');
    }
    await open(page);
    await page.keyboard.press('F8');
    expect(await page.evaluate(() => document.activeElement?.matches('.sp-toaster[tabindex="-1"]'))).toBe(true);
  });
});

test.describe('the composed rows on the page (T-223)', () => {
  test('REQ-482 · REQ-522 · an accordion keeps one item open, and its disabled item neither opens nor takes Tab', async ({ page }) => {
    const panel = await open(page);
    const accordion = panel.locator(at('collapse--accordion-disabled'));
    const details = accordion.locator('details');
    const summaries = accordion.locator('summary');
    await summaries.nth(0).click();
    await expect(details.nth(0)).toHaveAttribute('open', '');
    await summaries.nth(1).click();
    await expect(details.nth(1)).toHaveAttribute('open', '');
    await expect(details.nth(0)).not.toHaveAttribute('open');
    await summaries.nth(2).click({ force: true });
    await expect(details.nth(2)).not.toHaveAttribute('open');
    await summaries.nth(1).focus();
    await page.keyboard.press('Tab');
    await expect(summaries.nth(2)).not.toBeFocused();
    // Not an accordion: items open independently.
    const independent = panel.locator(at('collapse--one-open')).locator('details');
    await independent.nth(1).locator('summary').click();
    await expect(independent.nth(0)).toHaveAttribute('open', '');
    await expect(independent.nth(1)).toHaveAttribute('open', '');
  });

  test('REQ-476 · REQ-522 · Pagination moves on a click; a disabled previous takes no Tab', async ({ page }) => {
    const panel = await open(page);
    const middle = panel.locator(at('pagination--middle'));
    await middle.getByRole('button', { name: 'Next page' }).click();
    await expect(middle.locator('[aria-current="page"]')).toContainText('11');
    const first = panel.locator(at('pagination--total'));
    const previous = first.getByRole('button', { name: 'Previous page' });
    await expect(previous).toBeDisabled();
    await first.getByRole('button', { name: 'Page 2' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(previous).not.toBeFocused();
  });

  test('REQ-489 · REQ-522 · InputNumber: arrows step and clamp; its steppers take no Tab, and the one at the limit is disabled', async ({ page }) => {
    const panel = await open(page);
    const value = panel.locator(at('input-number--value'));
    await value.focus();
    await page.keyboard.press('ArrowUp');
    await expect(value).toHaveValue('4');
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowUp');
    await expect(value).toHaveValue('10');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.classList.contains('sp-ui-stepper'))).toBe(false);
    const atMin = panel.locator(at('input-number--at-min')).locator('xpath=..');
    await expect(atMin.getByRole('button', { name: 'Decrease' })).toBeDisabled();
    await expect(atMin.getByRole('button', { name: 'Increase' })).toBeEnabled();
  });

  test('REQ-323 · REQ-488 · REQ-489 · a native form submits the textareas, the quantities and the selects, after a keyboard change too', async ({ page }) => {
    const panel = await open(page);
    const entries = () =>
      panel.evaluate((form) => [...new FormData(form as HTMLFormElement)].filter(([k]) => ['notes', 'quantity', 'status'].includes(k)).map(([k, v]) => [k, String(v)]));
    expect(await entries()).toEqual([
      ['notes', 'Leave it at the door.'],
      ['notes', ''],
      ['quantity', '3'],
      ['quantity', '1'],
      ['status', ''],
      ['status', 'packed'],
    ]);
    await panel.locator(at('textarea--invalid')).fill('Ring twice');
    await panel.locator(at('input-number--value')).focus();
    await page.keyboard.press('ArrowUp');
    await panel.locator(at('select--placeholder')).getByRole('combobox').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    expect(await entries()).toEqual([
      ['notes', 'Leave it at the door.'],
      ['notes', 'Ring twice'],
      ['quantity', '4'],
      ['quantity', '1'],
      ['status', 'paid'],
      ['status', 'packed'],
    ]);
  });

  test('REQ-503 · REQ-522 · with reduced motion the overlays appear with no transition; the collapse chevron turns only when motion is welcome', async ({ page }) => {
    const panel = await open(page);
    const moving = (overlay: Locator) =>
      overlay.evaluate((root) =>
        [root, ...root.querySelectorAll('*')].filter((el) => {
          const s = getComputedStyle(el);
          return s.animationName !== 'none' || s.transitionDuration.split(',').some((d) => parseFloat(d) > 0);
        }).length,
      );
    await panel.getByRole('button', { name: 'Edit order', exact: true }).click();
    expect(await moving(panel.locator(`${at('modal--open')}--dialog`))).toBe(0);
    await page.keyboard.press('Escape');
    await panel.getByRole('button', { name: 'Details', exact: true }).click();
    expect(await moving(panel.locator(`${at('popover--open')}--popover`))).toBe(0);
    await page.keyboard.press('Escape');
    await panel.locator(at('select--placeholder')).getByRole('combobox').click();
    expect(await moving(panel.locator(at('select--placeholder')).locator('.sp-ui-select-content'))).toBe(0);
    await page.keyboard.press('Escape');
    const chevron = panel.locator(`${at('collapse--one-open')} summary [data-glyph="chevronDown"]`).first();
    expect(await chevron.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await chevron.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0.12s');
  });

  test('REQ-523 · under an ancestor’s dir="rtl" Pagination, Breadcrumb, the Drawer, placement and the steppers mirror', async ({ page }) => {
    const panel = await open(page);
    const x = async (locator: Locator) => (await locator.boundingBox())!.x;
    const pagination = panel.locator(at('pagination--middle'));
    const crumbs = panel.locator(at('breadcrumb--three')).locator('li');
    const steppers = panel.locator(at('input-number--value')).locator('xpath=..');
    const ltr = {
      pages: (await x(pagination.getByRole('button', { name: 'Previous page' }))) < (await x(pagination.getByRole('button', { name: 'Next page' }))),
      crumbs: (await x(crumbs.first())) < (await x(crumbs.last())),
      steppers: (await x(steppers.getByRole('button', { name: 'Decrease' }))) < (await x(steppers.getByRole('button', { name: 'Increase' }))),
    };
    expect(ltr).toEqual({ pages: true, crumbs: true, steppers: true });
    // A menu aligned to its start meets its trigger's left edge.
    const menuTrigger = panel.locator(at('dropdown-menu--open')).locator('.sp-ui-menu-trigger');
    await menuTrigger.click();
    const [mt, mp] = [(await menuTrigger.boundingBox())!, (await panel.locator(`${at('dropdown-menu--open')}--menu`).boundingBox())!];
    expect(Math.abs(mp.x - mt.x)).toBeLessThanOrEqual(1);
    await page.keyboard.press('Escape');
    await panel.evaluate((el) => el.setAttribute('dir', 'rtl'));
    const rtl = {
      pages: (await x(pagination.getByRole('button', { name: 'Previous page' }))) > (await x(pagination.getByRole('button', { name: 'Next page' }))),
      crumbs: (await x(crumbs.first())) > (await x(crumbs.last())),
      steppers: (await x(steppers.getByRole('button', { name: 'Decrease' }))) > (await x(steppers.getByRole('button', { name: 'Increase' }))),
    };
    expect(rtl).toEqual({ pages: true, crumbs: true, steppers: true });
    // The end drawer opens against the left edge.
    await panel.getByRole('button', { name: 'Filters', exact: true }).click();
    expect((await panel.locator(`${at('drawer--end-open')}--dialog`).boundingBox())!.x).toBeLessThanOrEqual(1);
    await page.keyboard.press('Escape');
    // A menu aligned to its start meets its trigger's right edge.
    const trigger = panel.locator(at('dropdown-menu--open')).locator('.sp-ui-menu-trigger');
    await trigger.click();
    const [t, p] = [(await trigger.boundingBox())!, (await panel.locator(`${at('dropdown-menu--open')}--menu`).boundingBox())!];
    expect(Math.abs(p.x + p.width - (t.x + t.width))).toBeLessThanOrEqual(1);
  });

  test('REQ-316 · REQ-522 · the focus ring of every new control is an exact outline of at least 2 px, 3:1 against the substrate, on every panel', async ({ page }) => {
    await open(page);
    const kinds = ['.sp-ui-select-trigger', '.sp-ui-menu-trigger', 'button.sp-ui-page', 'summary.sp-ui-collapse-summary', '.sp-breadcrumb a', '.sp-input-number input', '.sp-textarea textarea', '.sp-toast .sp-ui-icon-button'];
    for (const { key } of COMPOSED_PAGE.panels) {
      for (const kind of kinds) {
        const target = page.locator(`[data-panel="${key}"] ${kind}`).first();
        await target.focus();
        await page.keyboard.press('Shift');
        const ring = await target.evaluate((el) => {
          const holder = [el, el.closest('.sp-ui-box'), el.closest('.sp-ui')].find((h) => h && getComputedStyle(h).outlineStyle !== 'none') as Element | undefined;
          const s = getComputedStyle(holder ?? el);
          return { width: parseFloat(s.outlineWidth), style: s.outlineStyle, color: s.outlineColor, ground: getComputedStyle(el.closest('.sp-ui-page-panel')!).backgroundColor };
        });
        expect(ring.style, `${key} ${kind}`).toBe('solid');
        expect(ring.width, `${key} ${kind}`).toBeGreaterThanOrEqual(2);
        expect(contrast(ring.color, ring.ground), `${key} ${kind}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test('REQ-317 · REQ-522 · every new interactive target measures at least 24 × 24 px, open lists included', async ({ page }) => {
    const panel = await open(page);
    const measure = (selectors: readonly string[]) =>
      page.evaluate((list) => {
        const panels = document.querySelectorAll('.sp-ui-page-panel').length;
        return list.map((selector) => {
          const targets = [...document.querySelectorAll(`.sp-ui-page ${selector}`)].filter((el) => (el as HTMLElement).offsetParent !== null || el.closest(':popover-open, dialog[open]'));
          const small = targets
            .map((el) => ({ el, box: el.getBoundingClientRect() }))
            .filter(({ box }) => box.width < 24 || box.height < 24)
            .map(({ el, box }) => `${el.className || el.tagName} ${box.width}×${box.height}`);
          return { selector, count: targets.length, panels, small };
        });
      }, selectors);
    const closed = ['button.sp-ui-page', '.sp-ui-select-trigger', '.sp-ui-menu-trigger', 'summary.sp-ui-collapse-summary', '.sp-ui-stepper', '.sp-toast .sp-ui-icon-button', '.sp-input-number .sp-ui-box', '.sp-textarea .sp-ui-box'];
    for (const { selector, count, panels, small } of await measure(closed)) {
      expect(count, selector).toBeGreaterThanOrEqual(panels);
      expect(small, selector).toEqual([]);
    }
    await panel.locator(at('select--placeholder')).getByRole('combobox').click();
    for (const { selector, count, small } of await measure(['.sp-ui-option'])) {
      expect(count, selector).toBe(5);
      expect(small, selector).toEqual([]);
    }
    await page.keyboard.press('Escape');
    await panel.locator(at('dropdown-menu--open')).locator('.sp-ui-menu-trigger').click();
    for (const { selector, count, small } of await measure(['.sp-ui-menuitem'])) {
      expect(count, selector).toBe(4);
      expect(small, selector).toEqual([]);
    }
    await page.keyboard.press('Escape');
    await panel.getByRole('button', { name: 'Edit order', exact: true }).click();
    for (const { selector, count, small } of await measure(['dialog[open] .sp-ui-icon-button'])) {
      expect(count, selector).toBe(1);
      expect(small, selector).toEqual([]);
    }
  });
});

test.describe('accessibility audit of the feature-004 pages (T-223)', () => {
  test('REQ-520 · REQ-522 · axe-core reports no A or AA issue on /composed, closed', async ({ page }) => {
    await open(page);
    expect(await audit(page)).toEqual([]);
  });

  for (const [label, act] of [
    ['the modal', (panel: Locator) => panel.getByRole('button', { name: 'Edit order', exact: true }).click()],
    ['the drawer', (panel: Locator) => panel.getByRole('button', { name: 'Filters', exact: true }).click()],
    ['the popover', (panel: Locator) => panel.getByRole('button', { name: 'Details', exact: true }).click()],
    ['the tooltip', (panel: Locator) => panel.getByRole('button', { name: 'Copy id', exact: true }).focus()],
    ['the select list', (panel: Locator) => panel.locator(at('select--placeholder')).getByRole('combobox').click()],
    ['the menu', (panel: Locator) => panel.locator(at('dropdown-menu--open')).locator('.sp-ui-menu-trigger').click()],
  ] as const) {
    test(`REQ-520 · REQ-522 · axe-core reports no A or AA issue with ${label} open`, async ({ page }) => {
      const panel = await open(page);
      await act(panel);
      await expect(panel.locator(':popover-open, dialog[open]')).toHaveCount(1);
      expect(await audit(page)).toEqual([]);
    });
  }

  test('REQ-520 · axe-core reports no A or AA issue on /palettes', async ({ page }) => {
    await open(page, '/palettes');
    await expect(page.locator('[data-preset]')).toHaveCount(6);
    expect(await audit(page)).toEqual([]);
  });

  test('REQ-520 · axe-core reports no A or AA issue on /timeline, outside TimelineJS’s own DOM', async ({ page }) => {
    await open(page, '/timeline');
    await expect(page.locator('section.sp-timeline .sp-kl-mount .tl-storyslider')).toHaveCount(1);
    // TimelineJS's DOM is third-party markup (Art. 3 as amended, DD-042): its audit is Knight Lab's.
    expect(await audit(page, ['.sp-kl-mount'])).toEqual([]);
  });
});

test.describe('the other engines (T-223)', () => {
  test('REQ-494 · REQ-495 · REQ-491 · Firefox and WebKit run the Select, the Menu and the Modal by keyboard', async ({ playwright }, info) => {
    test.skip(info.project.name !== 'vite-react', 'once, against one app');
    for (const type of [playwright.firefox, playwright.webkit]) {
      const browser = await type.launch({ channel: undefined });
      try {
        const page = await browser.newPage({ baseURL: `http://localhost:${APPS['vite-react'].port}`, reducedMotion: 'reduce' });
        await page.goto('/composed');
        const panel = page.locator(`[data-panel="${INK!.key}"]`);
        const select = panel.locator(at('select--placeholder'));
        await select.getByRole('combobox').focus();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(select.locator('input[type="hidden"]'), type.name()).toHaveValue('paid');
        const menu = panel.locator(at('dropdown-menu--open'));
        await menu.locator('.sp-ui-menu-trigger').focus();
        await page.keyboard.press('Enter');
        await page.keyboard.press('ArrowDown');
        await expect(menu.locator('[data-key="duplicate"]'), type.name()).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(menu.locator('.sp-ui-menu-trigger'), type.name()).toBeFocused();
        const trigger = panel.getByRole('button', { name: 'Edit order', exact: true });
        await trigger.click();
        await expect(panel.locator(`${at('modal--open')}--dialog`), type.name()).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(trigger, type.name()).toBeFocused();
      } finally {
        await browser.close();
      }
    }
  });
});
