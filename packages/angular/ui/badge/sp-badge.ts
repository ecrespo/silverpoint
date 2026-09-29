import { booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, numberAttribute, type AfterViewInit } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiBadgeView, uiRequireName } from '@silverpoint/core/ui';

const optionalNumber = (v: unknown) => (v === undefined || v === null ? undefined : numberAttribute(v));

/** `<sp-badge>`: its count is text, in the accessible name (REQ-318). */
@Component({
  selector: 'sp-badge',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content }" />`,
})
export class SpBadge extends SpUiBase implements AfterViewInit {
  readonly count = input(undefined, { transform: optionalNumber });
  readonly max = input(undefined, { transform: optionalNumber });
  readonly dot = input(false, { transform: booleanAttribute });
  readonly label = input<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly view = computed(() =>
    uiBadgeView(
      { ...this.common(), count: this.count(), max: this.max(), dot: this.dot(), label: this.label() },
      this.resolved(),
      // The name is checked once the content is projected (ngAfterViewInit), not here.
      { text: '·' },
    ),
  );

  ngAfterViewInit(): void {
    uiRequireName('SpBadge', this.host.textContent ?? undefined, this.label());
  }
}
