import { Component, type Type } from '@angular/core';
import { SpDrawer, SpDropdownMenu, SpModal, SpPopover, SpSelect, SpToast, SpToastAction, SpToaster, SpTooltip, SpTrigger } from '@silverpoint/angular/ui';
import { UI_COMPONENTS } from '@silverpoint/core/ui';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiFixtureParts, uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import { ssrHost } from './ui-fixture';

/*
 * Angular overlays (T-215, T-216; REQ-490..REQ-502): the core's view, attribute for attribute,
 * open or closed by `data-state`, never by the `open` attribute; hosts are outside the parity
 * contract (DD-017). A trigger is the consumer's element marked `spTrigger`.
 */

const B = [SpModal, SpDrawer, SpPopover, SpTooltip, SpSelect, SpDropdownMenu, SpToast, SpToaster, SpTrigger, SpToastAction];
const host = (template: string, members: object = {}): Type<unknown> =>
  Component({ selector: 'app-root', imports: B, template })(
    class {
      constructor() {
        Object.assign(this, members);
      }
    },
  );

/** A fixture as an Angular consumer writes it: inputs by property, a `spTrigger` button, the value by `[value]`, the action as a template. */
function fixtureHost(fixture: UiFixture): Type<unknown> {
  const { props, value, slots, trigger } = uiFixtureParts(fixture);
  const inputs = Object.keys(props).map((name) => `[${name}]="props.${name}"`);
  if (value !== undefined) inputs.push('[value]="value"');
  // The menu's fixtures show its built-in button, as the core's canonical does.
  const triggerHtml = trigger !== undefined && fixture.component !== 'dropdown-menu' ? `<button type="button" spTrigger>${trigger}</button>` : '';
  const action = slots.action !== undefined ? `<ng-template spAction>${slots.action}</ng-template>` : '';
  const content = slots.content ?? '';
  const tag = `sp-${fixture.component}`;
  return host(`<${tag} ${inputs.join(' ')}>${triggerHtml}${action}${content}</${tag}>`, { props, value });
}

describe('Angular overlay markup (T-216)', () => {
  test.each(uiMatrix(['B']).filter((f) => f.scope === 'pr'))('REQ-502 · $id is the canonical tree', async (fixture) => {
    expect(compareUi(await ssrHost(fixtureHost(fixture)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-497 · the server renders and tears down a toaster without touching `document`, which it does not have', async () => {
    expect(typeof document).toBe('undefined');
    const errors: string[] = [];
    const record = (error: unknown) => errors.push(String(error));
    process.on('uncaughtException', record);
    try {
      // A teardown that throws leaves the render pending for good: give it a second, not the suite's timeout.
      const html = await Promise.race([ssrHost(host('<sp-toaster label="Notifications"></sp-toaster>')), new Promise<string>((resolve) => setTimeout(() => resolve('pending'), 1_000))]);
      expect(errors).toEqual([]);
      expect(html).toMatch(/<section[^>]*aria-label="Notifications"/);
    } finally {
      process.off('uncaughtException', record);
    }
  });

  test('REQ-490 · every overlay has its entry point', () => {
    for (const { slug } of UI_COMPONENTS.filter((c) => c.batch === 'B')) expect(existsSync(join(__dirname, `../ui/${slug}/ng-package.json`)), slug).toBe(true);
  });

  test("REQ-500 · REQ-502 · the server writes the trigger's ARIA and the open state, never the `open` attribute", async () => {
    const html = await ssrHost(host('<sp-modal id="m" title="T" [open]="true"><button type="button" spTrigger>Edit</button>x</sp-modal>'));
    expect(html).toMatch(/<button type="button" sptrigger="" aria-haspopup="dialog" aria-expanded="true" aria-controls="m--dialog">Edit<\/button>/);
    expect(html).not.toMatch(/<dialog[^>]* open/);
    const tip = await ssrHost(host('<sp-tooltip id="t" text="Copy"><button type="button" spTrigger>C</button></sp-tooltip>'));
    expect(tip).toMatch(/<button type="button" sptrigger="" aria-describedby="t--tooltip">C<\/button>/);
    // Angular's container comments aside.
    const menu = (await ssrHost(host('<sp-dropdown-menu id="d" label="Actions" [items]="[{ key: \'a\', label: \'A\' }]"><button type="button" spTrigger>More</button></sp-dropdown-menu>'))).replace(/<!--[^>]*-->/g, '');
    expect(menu).toMatch(/<span class="sp-ui-trigger"><button type="button" sptrigger="" aria-haspopup="menu" aria-expanded="false" aria-controls="d--menu">More<\/button><\/span>/);
  });
});
