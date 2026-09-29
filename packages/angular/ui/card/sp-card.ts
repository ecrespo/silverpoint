import { ChangeDetectionStrategy, Component, computed, contentChild, Directive, inject, input, TemplateRef } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { uiCardView, type SpCardProps } from '@silverpoint/core/ui';

/** `<ng-template spExtra>`: the card header's extra content. */
@Directive({ selector: 'ng-template[spExtra]' })
export class SpCardExtra {
  readonly template = inject(TemplateRef);
}

/** `<ng-template spFooter>`: the card's footer. */
@Directive({ selector: 'ng-template[spFooter]' })
export class SpCardFooter {
  readonly template = inject(TemplateRef);
}

/** `<sp-card>`: an `<article>` named by its heading, or a `<section>`; content projected, extra and footer as templates. */
@Component({
  selector: 'sp-card',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<ng-template #content><ng-content /></ng-template><sp-ui-tree [node]="view()" [slots]="{ content: content, extra: extra()?.template, footer: footer()?.template }" />`,
})
export class SpCard extends SpUiBase {
  readonly title = input<string>();
  readonly headingLevel = input<SpCardProps['headingLevel']>();

  protected readonly extra = contentChild(SpCardExtra);
  protected readonly footer = contentChild(SpCardFooter);

  protected readonly view = computed(() =>
    uiCardView({ ...this.common(), title: this.title(), headingLevel: this.headingLevel() }, this.resolved(), { extra: !!this.extra(), footer: !!this.footer() }),
  );
}
