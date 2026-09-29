import { booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, signal, type AfterViewInit } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiTagView, type UiToneLevel } from '@silverpoint/core/ui';

/** `<sp-tag>`: framed and toned; closable, a native close button that emits `(close)` (REQ-308). */
@Component({
  selector: 'sp-tag',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content }" (clicked)="close.emit()" />`,
})
export class SpTag extends SpUiBase implements AfterViewInit {
  readonly tone = input<UiToneLevel>();
  readonly closable = input(false, { transform: booleanAttribute });
  readonly closeLabel = input<string>();
  /** From the close button of a closable tag. */
  readonly close = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** The projected text, read once rendered: the close button's name includes it. */
  private readonly text = signal<string | undefined>(undefined);

  protected readonly view = computed(() =>
    uiTagView({ ...this.common(), tone: this.tone(), closable: this.closable(), closeLabel: this.closeLabel() }, this.resolved(), { text: this.text() }),
  );

  ngAfterViewInit(): void {
    this.text.set(this.host.querySelector('.sp-ui-label')?.textContent?.trim() || undefined);
  }
}
