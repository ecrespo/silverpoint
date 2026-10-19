import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { uiFixtureParts, type HarnessUiFixture } from '@silverpoint/example-harness';
import {
  SpAvatar,
  SpAvatarGroup,
  SpBreadcrumb,
  SpCardFooter,
  SpCollapse,
  SpCollapseItem,
  SpDescriptions,
  SpDrawer,
  SpDropdownMenu,
  SpEmpty,
  SpGlyph,
  SpInputNumber,
  SpModal,
  SpPagination,
  SpPopover,
  SpResult,
  SpSelect,
  SpStatistic,
  SpSurface,
  SpTable,
  SpTextarea,
  SpTimelineList,
  SpToast,
  SpToastAction,
  SpTooltip,
  SpTrigger,
} from '@silverpoint/angular/ui';

/** The components feature-004 adds (A1, A2, B): the gate's fixtures write them through this view. */
export const COMPOSED_UI: ReadonlySet<string> = new Set([
  'surface',
  'glyph',
  'table',
  'pagination',
  'breadcrumb',
  'avatar',
  'statistic',
  'descriptions',
  'timeline-list',
  'collapse',
  'empty',
  'result',
  'textarea',
  'input-number',
  'modal',
  'drawer',
  'popover',
  'tooltip',
  'select',
  'dropdown-menu',
  'toast',
]);

/**
 * One new component as an Angular consumer writes it: inputs bound one by one, the value as
 * `[defaultValue]`, `SpSurface` on the page's own `<div>`, an overlay's trigger a `<button spTrigger>`
 * projected into it, a footer or a toast's action an `ng-template`. Glyph `all`, Avatar `group` and
 * Collapse compose several components (Data Model §5).
 */
@Component({
  selector: 'app-ui-composed',
  imports: [
    SpAvatar,
    SpAvatarGroup,
    SpBreadcrumb,
    SpCardFooter,
    SpCollapse,
    SpCollapseItem,
    SpDescriptions,
    SpDrawer,
    SpDropdownMenu,
    SpEmpty,
    SpGlyph,
    SpInputNumber,
    SpModal,
    SpPagination,
    SpPopover,
    SpResult,
    SpSelect,
    SpStatistic,
    SpSurface,
    SpTable,
    SpTextarea,
    SpTimelineList,
    SpToast,
    SpToastAction,
    SpTooltip,
    SpTrigger,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @let x = parts();
    @let p = x.props;
    @let s = x.slots;
    @switch (fixture().component) {
      @case ('surface') {
        <div spSurface [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [frame]="p.frame" [tone]="p.tone">{{ s.content }}</div>
      }
      @case ('glyph') {
        @for (glyph of p.glyphs; track glyph) {
          <sp-glyph [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [glyph]="glyph" />
        }
      }
      @case ('table') {
        <sp-table [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [caption]="p.caption" [columns]="p.columns" [data]="p.data" [rowKey]="p.rowKey" [sortKey]="p.sortKey" [sortOrder]="p.sortOrder" [striped]="p.striped" [emptyText]="p.emptyText" />
      }
      @case ('pagination') {
        <sp-pagination [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [total]="p.total" [pageSize]="p.pageSize" [current]="p.current" [showTotal]="p.showTotal" />
      }
      @case ('breadcrumb') {
        <sp-breadcrumb [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [items]="p.items" />
      }
      @case ('avatar') {
        @if (p.avatars; as avatars) {
          <sp-avatar-group [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label">
            @for (avatar of avatars; track $index) {
              <sp-avatar [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [name]="avatar.name" [shape]="avatar.shape" />
            }
          </sp-avatar-group>
        } @else {
          <sp-avatar [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [name]="p.name" [shape]="p.shape" />
        }
      }
      @case ('statistic') {
        <sp-statistic [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [title]="p.title" [value]="p.value" [suffix]="p.suffix" [trend]="p.trend" [delta]="p.delta" />
      }
      @case ('descriptions') {
        <sp-descriptions [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [title]="p.title" [items]="p.items" [columns]="p.columns" [bordered]="p.bordered" />
      }
      @case ('timeline-list') {
        <sp-timeline-list [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [items]="p.items" />
      }
      @case ('collapse') {
        <sp-collapse [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [accordion]="p.accordion">
          @for (item of p.items; track item.key) {
            <sp-collapse-item [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [title]="item.title" [disabled]="item.disabled" [defaultOpen]="item.open">{{ item.content }}</sp-collapse-item>
          }
        </sp-collapse>
      }
      @case ('empty') {
        <sp-empty [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [description]="p.description" />
      }
      @case ('result') {
        <sp-result [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [status]="p.status" [title]="p.title" [subtitle]="p.subtitle" />
      }
      @case ('textarea') {
        <sp-textarea [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [name]="p.name" [maxLength]="p.maxLength" [showCount]="p.showCount" [invalid]="p.invalid" [message]="p.message" [defaultValue]="x.value" />
      }
      @case ('input-number') {
        <sp-input-number [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [name]="p.name" [min]="p.min" [max]="p.max" [defaultValue]="x.value" />
      }
      @case ('modal') {
        <sp-modal [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [open]="p.open" [title]="p.title" [description]="p.description">
          <button type="button" spTrigger>{{ x.trigger }}</button>
          @if (s.footer; as footer) {
            <ng-template spFooter>{{ footer }}</ng-template>
          }
          {{ s.content }}
        </sp-modal>
      }
      @case ('drawer') {
        <sp-drawer [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [open]="p.open" [side]="p.side" [title]="p.title">
          <button type="button" spTrigger>{{ x.trigger }}</button>
          @if (s.footer; as footer) {
            <ng-template spFooter>{{ footer }}</ng-template>
          }
          {{ s.content }}
        </sp-drawer>
      }
      @case ('popover') {
        <sp-popover [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [open]="p.open" [title]="p.title">
          <button type="button" spTrigger>{{ x.trigger }}</button>
          {{ s.content }}
        </sp-popover>
      }
      @case ('tooltip') {
        <sp-tooltip [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [open]="p.open" [text]="p.text">
          <button type="button" spTrigger>{{ x.trigger }}</button>
        </sp-tooltip>
      }
      @case ('select') {
        <sp-select [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [name]="p.name" [items]="p.items" [open]="p.open ?? false" [defaultValue]="x.value" />
      }
      @case ('dropdown-menu') {
        <!-- The menu draws its own button. -->
        <sp-dropdown-menu [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [label]="p.label" [items]="p.items" [open]="p.open" />
      }
      @case ('toast') {
        <sp-toast [id]="p.id" [ground]="p.ground" [substrate]="p.substrate" [mode]="p.mode" [size]="p.size" [open]="p.open" [kind]="p.kind" [title]="p.title" [description]="p.description">
          @if (s.action; as action) {
            <ng-template spAction>{{ action }}</ng-template>
          }
        </sp-toast>
      }
    }
  `,
})
export class UiComposedView {
  readonly fixture = input.required<HarnessUiFixture>();
  protected readonly parts = computed(
    () => uiFixtureParts(this.fixture()) as { props: Record<string, any>; value: any; slots: Record<string, string | undefined>; trigger?: string },
  );
}
