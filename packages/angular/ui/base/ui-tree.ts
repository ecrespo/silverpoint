import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  Renderer2,
  type OnChanges,
  type TemplateRef,
} from '@angular/core';
import type { UiAttrValue, UiElement, UiSlot } from '@silverpoint/core/ui';

type Attrs = Readonly<Record<string, UiAttrValue>>;

/**
 * Writes an element's attributes as the core's view gives them, removing those it no longer gives.
 * `value` and `checked` are also live properties in the browser, so a controlled value shows.
 */
export function syncUiAttrs(renderer: Renderer2, element: Element, previous: Attrs, next: Attrs, browser: boolean): Attrs {
  for (const name of Object.keys(previous)) if (!(name in next)) renderer.removeAttribute(element, name);
  for (const [name, value] of Object.entries(next)) if (previous[name] !== value) renderer.setAttribute(element, name, value === true ? '' : value);
  if (browser && element.tagName === 'INPUT') {
    if ('value' in next || 'value' in previous) renderer.setProperty(element, 'value', typeof next.value === 'string' ? next.value : '');
    if ('checked' in next || 'checked' in previous) renderer.setProperty(element, 'checked', next.checked === true);
  }
  return next;
}

/** `[spUiAttrs]`: an element of the core's view, attribute for attribute (API delta §4). */
@Directive({ selector: '[spUiAttrs]' })
export class SpUiAttrs implements OnChanges {
  readonly spUiAttrs = input.required<Attrs>();
  private readonly element = inject<ElementRef<Element>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private previous: Attrs = {};

  ngOnChanges(): void {
    this.previous = syncUiAttrs(this.renderer, this.element, this.previous, this.spUiAttrs(), this.browser);
  }
}

/**
 * `<sp-ui-tree>`: writes a core view tree, element by element, in one component template —
 * so no wrapper sits between siblings, and sibling selectors of ui.css hold. Its host is
 * `display: contents` and, like every Angular host, outside the parity contract (DD-017).
 */
@Component({
  selector: 'sp-ui-tree',
  imports: [NgTemplateOutlet, SpUiAttrs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template:
    `<ng-template #kids let-n>@for (c of n.children; track $index) {@if (c.tag) {<ng-container *ngTemplateOutlet="el; context: { $implicit: c }" />} @else if (c.slot) {<ng-container *ngTemplateOutlet="slotOf(c.slot)" />} @else {<ng-container>{{ c.text }}</ng-container>}}</ng-template>` +
    `<ng-template #el let-n>@switch (n.tag) {` +
    `@case ('span') {<span [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></span>}` +
    `@case ('div') {<div [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></div>}` +
    `@case ('label') {<label [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></label>}` +
    `@case ('p') {<p [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></p>}` +
    `@case ('article') {<article [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></article>}` +
    `@case ('section') {<section [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></section>}` +
    `@case ('h2') {<h2 [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></h2>}` +
    `@case ('h3') {<h3 [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></h3>}` +
    `@case ('h4') {<h4 [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></h4>}` +
    `@case ('h5') {<h5 [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></h5>}` +
    `@case ('h6') {<h6 [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></h6>}` +
    `@case ('fieldset') {<fieldset [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></fieldset>}` +
    `@case ('legend') {<legend [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></legend>}` +
    `@case ('ol') {<ol [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></ol>}` +
    `@case ('ul') {<ul [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></ul>}` +
    `@case ('li') {<li [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></li>}` +
    `@case ('button') {<button [spUiAttrs]="n.attrs" (click)="clicked.emit($event)"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></button>}` +
    `@case ('a') {<a [spUiAttrs]="n.attrs"><ng-container *ngTemplateOutlet="kids; context: { $implicit: n }" /></a>}` +
    `@case ('input') {<input [spUiAttrs]="n.attrs" (input)="n.bind === 'native' && nativeInput.emit($event)" (change)="n.bind === 'native' && nativeChange.emit($event)" (click)="n.bind === 'native' && nativeClick.emit($event)" />}` +
    `@case ('svg') {<svg [spUiAttrs]="n.attrs">@for (p of n.children; track $index) {<svg:path [spUiAttrs]="p.attrs" />}</svg>}` +
    `}</ng-template>` +
    `@if (rootless()) {<ng-container *ngTemplateOutlet="kids; context: { $implicit: node() }" />} @else {<ng-container *ngTemplateOutlet="el; context: { $implicit: node() }" />}`,
})
export class SpUiTree {
  readonly node = input.required<UiElement>();
  /** Write the root's children only: its host is the root (an attribute component, DD-024). */
  readonly rootless = input(false);
  /** Content for each slot of the view, as templates of the component that owns the content. */
  readonly slots = input<Partial<Record<UiSlot, TemplateRef<unknown> | null | undefined>>>({});
  readonly nativeInput = output<Event>();
  readonly nativeChange = output<Event>();
  /** A click on a native input: a read-only Rate cancels it. */
  readonly nativeClick = output<Event>();
  /** A click on any button of the view: a tab, a close button; `currentTarget` tells which. */
  readonly clicked = output<Event>();

  private readonly slotMap = computed(() => this.slots());
  protected slotOf(slot: UiSlot): TemplateRef<unknown> | null {
    return this.slotMap()[slot] ?? null;
  }
}
