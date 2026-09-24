import { computed, contentChild, Directive, inject, input, output, signal, type Signal } from '@angular/core';
import {
  instanceId,
  reduceInteraction,
  type ActiveItem,
  type ChartRecipe,
  type CommonChartProps,
  type Geometry,
  type InteractionEvent,
  type PointerKind,
} from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { SILVERPOINT_CONFIG } from './config';
import { injectForcedPrecision, injectMeasuredWidth, injectTypefaceCheck, SilverpointIds } from './environment';
import { SpTooltip } from './tooltip';

type Prop<K extends keyof CommonChartProps> = CommonChartProps[K];

/**
 * What every chart component shares: the common inputs, the two outputs, the readout template and
 * the imperative API, rendering a recipe through the core pipeline. A chart component extends it,
 * passes its recipe to the constructor, declares its own inputs and gathers them in `ownProps`, so
 * the charts differ only in the recipe (Art. 2). Its template is always:
 *
 * ```html
 * <sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" [interactive]="true" (rootEvent)="onRootEvent($event)">
 *   <sp-chart-overlay [rendered]="rendered()" [active]="active()" [tooltip]="tooltip()?.template" />
 * </sp-chart-frame>
 * ```
 */
@Directive()
export abstract class SpChart<P extends CommonChartProps> {
  readonly data = input<Prop<'data'>>();
  readonly ground = input<Prop<'ground'>>();
  readonly substrate = input<Prop<'substrate'>>();
  readonly mode = input<Prop<'mode'>>();
  readonly seed = input<Prop<'seed'>>();
  readonly id = input<Prop<'id'>>();
  readonly height = input<Prop<'height'>>();
  readonly width = input<Prop<'width'>>();
  readonly chrome = input<Prop<'chrome'>>();
  readonly hatchFill = input<Prop<'hatchFill'>>();
  readonly title = input<Prop<'title'>>();
  readonly badge = input<Prop<'badge'>>();
  readonly value = input<Prop<'value'>>();
  readonly unit = input<Prop<'unit'>>();
  readonly footerLeft = input<Prop<'footerLeft'>>();
  readonly footerRight = input<Prop<'footerRight'>>();
  readonly label = input<Prop<'label'>>();
  readonly description = input<Prop<'description'>>();
  readonly dataTable = input<Prop<'dataTable'>>();
  readonly locale = input<Prop<'locale'>>();
  readonly numberFormat = input<Prop<'numberFormat'>>();
  readonly className = input<Prop<'className'>>();

  /** The active item changed, or `null` when it cleared (REQ-141, REQ-143). */
  readonly activeChange = output<ActiveItem | null>();
  /** An item was chosen by click, Enter or Space (API Spec §9). */
  readonly select = output<ActiveItem>();

  /** The chart's own inputs, beyond the common ones. */
  protected abstract readonly ownProps: Signal<Omit<P, keyof CommonChartProps>>;

  private readonly provider = inject(SILVERPOINT_CONFIG, { optional: true }) ?? {};
  private readonly generated = inject(SilverpointIds).next();
  private readonly forcedPrecision = injectForcedPrecision();
  private readonly measured = injectMeasuredWidth(() => this.width() === undefined);
  constructor(private readonly recipe: ChartRecipe<P>) {
    injectTypefaceCheck(recipe.name);
  }

  private readonly props = computed<CommonChartProps>(() => ({
    data: this.data(),
    ground: this.ground(),
    substrate: this.substrate(),
    mode: this.mode(),
    seed: this.seed(),
    id: this.id(),
    height: this.height(),
    width: this.width(),
    chrome: this.chrome(),
    hatchFill: this.hatchFill(),
    title: this.title(),
    badge: this.badge(),
    value: this.value(),
    unit: this.unit(),
    footerLeft: this.footerLeft(),
    footerRight: this.footerRight(),
    label: this.label(),
    description: this.description(),
    dataTable: this.dataTable(),
    locale: this.locale(),
    numberFormat: this.numberFormat(),
    className: this.className(),
  }));

  protected readonly rendered = computed(() =>
    renderChart(this.recipe, { ...this.props(), ...this.ownProps() } as P, {
      id: instanceId(this.recipe.name, this.generated),
      width: this.measured(),
      provider: this.provider,
      forcedPrecision: this.forcedPrecision(),
    }),
  );

  protected readonly rootClass = computed(() =>
    ['sp-root', `sp-ground-${this.rendered().ground}`, this.className()].filter(Boolean).join(' '),
  );

  /** A consumer-supplied readout template (REQ-142). */
  protected readonly tooltip = contentChild(SpTooltip);
  /** The active item: interaction state REQ-141 requires. */
  protected readonly active = signal<ActiveItem | null>(null);

  private readonly dispatch = (event: InteractionEvent): boolean => {
    const result = reduceInteraction(this.rendered().geometry, this.active(), event);
    if (result.changed) {
      this.active.set(result.active);
      this.activeChange.emit(result.active);
    }
    if (result.selected) this.select.emit(result.selected);
    return result.handled;
  };

  /** Turns a DOM event of the chart root into a core interaction event; decides nothing. */
  protected readonly onRootEvent = (event: Event): void => {
    const root = event.currentTarget as HTMLElement | null;
    switch (event.type) {
      case 'pointermove':
      case 'pointerdown':
      case 'click': {
        const svg = root?.querySelector('svg.sp-chart');
        if (!svg) return;
        const box = svg.getBoundingClientRect();
        const pointer = event as PointerEvent;
        this.dispatch({
          type: event.type === 'click' ? 'click' : 'pointer',
          client: { x: pointer.clientX, y: pointer.clientY },
          box: { left: box.left, top: box.top, width: box.width, height: box.height },
          kind: (pointer.pointerType || 'mouse') as PointerKind,
        });
        return;
      }
      case 'pointerleave':
        this.dispatch({ type: 'leave' });
        return;
      case 'focus':
      case 'blur':
        this.dispatch({ type: event.type });
        return;
      case 'keydown':
        if (this.dispatch({ type: 'key', key: (event as KeyboardEvent).key })) event.preventDefault();
    }
  };

  /** The rendered geometry (API Spec §8.2, symmetric with `ChartHandle`). */
  getGeometry(): Geometry {
    return this.rendered().geometry;
  }

  /** The canonical SVG markup of the chart. */
  toSVGString(): string {
    return toSVGString(this.rendered());
  }
}
