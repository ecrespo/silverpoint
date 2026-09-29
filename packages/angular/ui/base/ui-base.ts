import { computed, Directive, inject, input } from '@angular/core';
import type { GroundRef, InkMode, Seed, SubstrateName } from '@silverpoint/core';
import { resolveUi, type CommonUiProps, type UiSize } from '@silverpoint/core/ui';
import { injectForcedPrecision, SILVERPOINT_CONFIG, SP_DASHBOARD_CELL } from '@silverpoint/angular/env';

/**
 * What every UI component shares (T-143): the common inputs, and their resolution with the charts'
 * precedence — input, then dashboard cell, then `provideSilverpoint`, then the defaults, with a
 * forced `precision` read after the first render (REQ-311, REQ-123).
 */
@Directive()
export abstract class SpUiBase {
  readonly id = input<string>();
  readonly seed = input<Seed>();
  readonly ground = input<GroundRef>();
  readonly substrate = input<SubstrateName>();
  readonly mode = input<InkMode>();
  readonly size = input<UiSize>();
  readonly className = input<string>();

  private readonly provider = inject(SILVERPOINT_CONFIG, { optional: true }) ?? {};
  private readonly cell = inject(SP_DASHBOARD_CELL, { optional: true });
  private readonly forced = injectForcedPrecision();

  protected readonly common = computed<CommonUiProps>(() => ({
    id: this.id(),
    seed: this.seed(),
    ground: this.ground(),
    substrate: this.substrate(),
    mode: this.mode(),
    size: this.size(),
    className: this.className(),
  }));

  protected readonly resolved = computed(() =>
    resolveUi(this.common(), { provider: this.provider, cell: this.cell?.context()?.config, forcedPrecision: this.forced() }),
  );
}
