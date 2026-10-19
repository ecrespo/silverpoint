import { afterRenderEffect, booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, Directive, ElementRef, inject, input, output, signal, TemplateRef, untracked, type OutputEmitterRef } from '@angular/core';
import { SpUiBase, SpUiTree } from '@silverpoint/angular/ui/base';
import { timelineMount, timelineView, type TimelineData, type TimelineJsModule } from '@silverpoint/core/timeline';

/**
 * TimelineJS's module without its package entry, which imports a Less stylesheet no consumer bundler
 * loads; the literal path lets the consumer's bundler split it into a chunk of its own.
 */
// @ts-expect-error TimelineJS ships no types; the module is read as `TimelineJsModule`.
const load = () => import('@knight-lab/timelinejs/src/js/timeline/Timeline.js') as Promise<TimelineJsModule>;

/** `<ng-template spFallback>`: what the mount shows when `@knight-lab/timelinejs` cannot be loaded (REQ-515). */
@Directive({ selector: 'ng-template[spFallback]' })
export class SpTimelineFallback {
  readonly template = inject(TemplateRef);
}

/** `<sp-timeline>`: TimelineJS inked by the ground, loaded on the client only (REQ-510..REQ-515). */
@Component({
  selector: 'sp-timeline',
  imports: [SpUiTree],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<sp-ui-tree [node]="view()" [slots]="{ fallback: fallback()?.template }" />`,
})
export class SpTimeline extends SpUiBase {
  readonly data = input.required<TimelineData>();
  readonly options = input<Readonly<Record<string, unknown>>>();
  readonly height = input<string>();
  readonly inkedFrames = input(true, { transform: booleanAttribute });
  readonly card = input(true, { transform: booleanAttribute });
  readonly label = input<string>();

  /** The slide shown changed; TimelineJS's `unique_id` of it. */
  readonly change = output<string | undefined>();
  readonly loaded = output<unknown>();
  readonly navNext = output<void>();
  readonly navPrevious = output<void>();
  readonly zoomIn = output<void>();
  readonly zoomOut = output<void>();
  readonly backToStart = output<void>();

  protected readonly fallback = contentChild(SpTimelineFallback);
  private readonly failed = signal(false);

  protected readonly view = computed(() =>
    timelineView(
      { ...this.common(), data: this.data(), options: this.options(), height: this.height(), inkedFrames: this.inkedFrames(), card: this.card(), label: this.label() },
      this.resolved(),
      { failed: this.failed() },
    ),
  );

  constructor() {
    super();
    const host = inject(ElementRef).nativeElement as HTMLElement;
    const outputs: Record<string, OutputEmitterRef<never>> = {
      change: this.change,
      loaded: this.loaded,
      navNext: this.navNext,
      navPrevious: this.navPrevious,
      zoomIn: this.zoomIn,
      zoomOut: this.zoomOut,
      backToStart: this.backToStart,
    } as never;
    // Browser only, after render; rebuilt when the data, the options or `inkedFrames` change (REQ-513).
    afterRenderEffect((onCleanup) => {
      const data = this.data();
      const options = this.options();
      const inked = this.inkedFrames();
      const surface = host.querySelector<HTMLElement>(':scope > sp-ui-tree > section');
      if (!surface) return;
      onCleanup(
        untracked(() =>
          timelineMount(surface, {
            load,
            data,
            options,
            inked,
            emit: (event, ...value) => (outputs[event] as OutputEmitterRef<unknown> | undefined)?.emit(value[0]),
            failed: () => this.failed.set(true),
          }),
        ),
      );
    });
  }
}
