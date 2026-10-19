import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input, model, output } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiCollapseGroup, uiCollapseItemView, uiCollapseView } from '@silverpoint/core/ui';

/** Absent stays `undefined`, so the core's default holds. */
const optionalBoolean = (value: unknown): boolean | undefined => (value === undefined ? undefined : booleanAttribute(value));

/** `<sp-collapse>`: a frame around native `<details>` items; `accordion` makes them exclusive, natively (REQ-482). */
@Component({
  selector: 'sp-collapse',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content }" />`,
})
export class SpCollapse extends SpUiBase {
  readonly accordion = input(false, { transform: booleanAttribute });
  readonly bordered = input(undefined, { transform: optionalBoolean });

  /** @internal The `name` its items share. */
  readonly group = computed(() => uiCollapseGroup({ id: this.id(), accordion: this.accordion() }));

  protected readonly view = computed(() => uiCollapseView({ ...this.common(), accordion: this.accordion(), bordered: this.bordered() }, this.resolved()));
}

/** `<sp-collapse-item>`: a native `<details>` with `[(open)]`; a disabled one cancels its summary's activation (REQ-482). */
@Component({
  selector: 'sp-collapse-item',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content }" (toggled)="toggled($event)" (clicked)="activated($event)" />`,
})
export class SpCollapseItem extends SpUiBase {
  readonly title = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly open = model<boolean>();
  readonly defaultOpen = input(undefined, { transform: optionalBoolean });
  /** The item opened or closed, by the user or by its accordion. */
  readonly toggle = output<boolean>();

  private readonly collapse = inject(SpCollapse, { optional: true });
  private readonly isOpen = computed(() => this.open() ?? this.defaultOpen() ?? false);

  protected readonly view = computed(() =>
    uiCollapseItemView({ ...this.common(), title: this.title(), disabled: this.disabled() }, this.resolved(), { open: this.isOpen(), group: this.collapse?.group() }),
  );

  protected toggled(event: Event): void {
    const next = (event.currentTarget as HTMLDetailsElement).open;
    if (next === this.isOpen()) return;
    this.open.set(next);
    this.toggle.emit(next);
  }

  protected activated(event: Event): void {
    if (this.disabled()) event.preventDefault();
  }
}
