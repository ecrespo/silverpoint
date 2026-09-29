import { Component } from '@angular/core';
import {
  SpAlert,
  SpBadge,
  SpProgress,
  SpRadioGroup,
  SpRate,
  SpSegmented,
  SpSkeleton,
  SpSlider,
  SpSteps,
  SpTabPanel,
  SpTabs,
  SpTag,
} from '@silverpoint/angular/ui';
import { describe, expect, test } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiMatrix } from '../../../tools/visual-gate/ui-matrix';
import { fixtureHost, ssrHost } from './ui-fixture';

const B23 = [SpRadioGroup, SpSegmented, SpTabs, SpTabPanel, SpSlider, SpRate, SpSteps, SpTag, SpBadge, SpProgress, SpAlert, SpSkeleton];
const SLUGS = ['radio-group', 'segmented', 'tabs', 'slider', 'rate', 'steps', 'tag', 'badge', 'progress', 'alert', 'skeleton'];

describe('Angular B2 and B3 markup (T-149, T-152)', () => {
  test.each(uiMatrix().filter((f) => f.scope === 'pr' && SLUGS.includes(f.component)))('REQ-327 · $id is the canonical tree', async (fixture) => {
    expect(compareUi(await ssrHost(fixtureHost(fixture, B23)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-314 · SpTabPanel renders its tabpanel, related to its tab by the tabs\' id, hidden unless selected', async () => {
    const Host = Component({
      selector: 'app-root',
      imports: [SpTabs, SpTabPanel],
      template: `<sp-tabs id="t" [items]="items" value="b"><sp-tab-panel value="a">first</sp-tab-panel><sp-tab-panel value="b">second</sp-tab-panel></sp-tabs>`,
    })(
      class {
        items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
      },
    );
    const html = (await ssrHost(Host)).replace(/<!--[^>]*-->/g, '');
    expect(html).toMatch(/<div[^>]*id="t--panel-a"[^>]*hidden=""[^>]*>first<\/div>/);
    expect(html).toMatch(/<div[^>]*aria-labelledby="t--tab-b"[^>]*>second<\/div>/);
    expect(html).not.toMatch(/id="t--panel-b"[^>]*hidden/);
  });
});
