import { Directive, inject, TemplateRef } from '@angular/core';
import type { ActiveItem, Readout } from '@silverpoint/core';

/** Context of an `spTooltip` template: `let-active` and `let-readout="readout"`. */
export interface SpTooltipContext {
  readonly $implicit: ActiveItem;
  readonly readout: Readout;
}

/** Marks a consumer-supplied readout template (REQ-142): `<ng-template spTooltip let-active>`. */
@Directive({ selector: 'ng-template[spTooltip]' })
export class SpTooltip {
  readonly template = inject<TemplateRef<SpTooltipContext>>(TemplateRef);
}
