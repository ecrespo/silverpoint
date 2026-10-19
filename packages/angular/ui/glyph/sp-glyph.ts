import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiGlyphView } from '@silverpoint/core/ui';

/** `<sp-glyph>`: one exact mark of `UI_GLYPHS` (REQ-472). */
@Component({
  selector: 'sp-glyph',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" />`,
})
export class SpGlyph extends SpUiBase {
  readonly glyph = input.required<string>();

  protected readonly view = computed(() => uiGlyphView({ ...this.common(), glyph: this.glyph() }, this.resolved()));
}
