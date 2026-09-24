import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  injectForcedPrecision,
  injectMeasuredWidth,
  SILVERPOINT_CONFIG,
  SilverpointIds,
  SpChartFrame,
} from '@silverpoint/angular';
import { instanceId, lineChart, type ActiveItem, type Geometry, type LineChartProps } from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';

type Prop<K extends keyof LineChartProps> = LineChartProps[K];

/**
 * `<sp-line-chart>` (REQ-060): standalone, signal inputs, OnPush (REQ-101). Inputs are named
 * as in every other adapter (API Spec §4).
 */
@Component({
  selector: 'sp-line-chart',
  imports: [SpChartFrame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sp-chart-frame [rendered]="rendered()" [rootClass]="rootClass()" />`,
})
export class SpLineChart {
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
  readonly xKey = input<Prop<'xKey'>>();
  readonly valueKey = input<Prop<'valueKey'>>();
  readonly secondaryKey = input<Prop<'secondaryKey'>>();
  readonly curve = input<Prop<'curve'>>();
  readonly series = input<Prop<'series'>>();
  readonly connectNulls = input<Prop<'connectNulls'>>();

  /** The active item changed, or `null` when it cleared (REQ-141, REQ-143). */
  readonly activeChange = output<ActiveItem | null>();
  /** An item was chosen by click, Enter or Space (API Spec §9). */
  readonly select = output<ActiveItem>();

  private readonly provider = inject(SILVERPOINT_CONFIG, { optional: true }) ?? {};
  private readonly generated = inject(SilverpointIds).next();
  private readonly forcedPrecision = injectForcedPrecision();
  private readonly measured = injectMeasuredWidth(() => this.width() === undefined);

  private readonly props = computed<LineChartProps>(() => ({
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
    xKey: this.xKey(),
    valueKey: this.valueKey(),
    secondaryKey: this.secondaryKey(),
    curve: this.curve(),
    series: this.series(),
    connectNulls: this.connectNulls(),
  }));

  protected readonly rendered = computed(() =>
    renderChart(lineChart, this.props(), {
      id: instanceId(lineChart.name, this.generated),
      width: this.measured(),
      provider: this.provider,
      forcedPrecision: this.forcedPrecision(),
    }),
  );

  protected readonly rootClass = computed(() =>
    ['sp-root', `sp-ground-${this.rendered().ground}`, this.className()].filter(Boolean).join(' '),
  );

  /** The rendered geometry (API Spec §8.2, symmetric with `ChartHandle`). */
  getGeometry(): Geometry {
    return this.rendered().geometry;
  }

  /** The canonical SVG markup of the chart. */
  toSVGString(): string {
    return toSVGString(this.rendered());
  }
}
