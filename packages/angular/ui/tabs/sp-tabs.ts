import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, InjectionToken, input, model, type Signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SpUiControl, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiItems, uiSelectedKey, uiTabPanelView, uiTabsView, type SpTabsProps, type UiItem, type UiOrientation } from '@silverpoint/core/ui';

/** What a panel reads from its tabs: their id, for the ids that relate them, and the selected key. */
export const SP_TABS = new InjectionToken<Signal<{ id?: string; value: string | null }>>('SP_TABS');

/** `<sp-tabs>`: a tablist of native buttons; panels are `<sp-tab-panel>` children; `[(value)]` or forms (REQ-315). */
@Component({
  selector: 'sp-tabs',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents', '(keydown)': "rove($event, '[role=\"tab\"]', orientation() ?? 'horizontal', activation() !== 'manual')" },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SpTabs), multi: true },
    { provide: SP_TABS, useFactory: () => inject(SpTabs).context },
  ],
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content }" (clicked)="commit($any($event.currentTarget).dataset.key)" />`,
})
export class SpTabs extends SpUiControl<string> {
  readonly value = model<string>();
  readonly defaultValue = input<string>();
  readonly items = input.required<readonly UiItem[]>();
  readonly label = input<string>();
  readonly orientation = input<UiOrientation>();
  readonly activation = input<SpTabsProps['activation']>();

  private readonly current = computed(() => this.value() ?? this.defaultValue() ?? null);
  private readonly shown = computed(() => (this.formDisabled() ? this.items().map((item) => ({ ...item, disabled: true })) : this.items()));

  /** Shared with the panels through `SP_TABS`. */
  readonly context = computed(() => ({ id: this.id(), value: uiSelectedKey(uiItems(this.shown(), 'SpTabs'), this.current(), 'first') }));

  protected readonly view = computed(() =>
    uiTabsView(
      { ...this.common(), items: this.shown(), label: this.label(), orientation: this.orientation(), activation: this.activation() },
      this.resolved(),
      { value: this.current() },
    ),
  );
}

/** `<sp-tab-panel value="key">`: a `tabpanel` labelled by its tab, hidden unless its tab is selected. */
@Component({
  selector: 'sp-tab-panel',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content }" />`,
})
export class SpTabPanel {
  readonly value = input.required<string>();
  private readonly tabs = inject(SP_TABS, { optional: true });
  protected readonly view = computed(() => uiTabPanelView({ value: this.value() }, this.tabs?.() ?? { value: null }));
}
