import { UI_COMPONENTS, type UiFamily, type UiGroup } from '@silverpoint/core/ui';
import { UI_DEMOS } from '@silverpoint/core/ui-demos';
import {
  SpAlert,
  SpAvatar,
  SpAvatarGroup,
  SpBadge,
  SpBreadcrumb,
  SpButton,
  SpCard,
  SpCheckbox,
  SpCollapse,
  SpCollapseItem,
  SpDescriptions,
  SpDivider,
  SpDrawer,
  SpDropdownMenu,
  SpEmpty,
  SpGlyph,
  SpInput,
  SpInputNumber,
  SpModal,
  SpPagination,
  SpPopover,
  SpProgress,
  SpRadioGroup,
  SpRate,
  SpResult,
  SpSegmented,
  SpSelect,
  SpSkeleton,
  SpSlider,
  SpStatistic,
  SpSteps,
  SpSurface,
  SpSwitch,
  SpTable,
  SpTabPanel,
  SpTabs,
  SpTag,
  SpTextarea,
  SpTimelineList,
  SpToast,
  SpToaster,
  SpTooltip,
} from '@silverpoint/react/ui';
import type { ComponentType, ReactNode } from 'react';
import reference from '../../generated/props.json';

interface PropDoc {
  readonly name: string;
  readonly type: string;
  readonly optional: boolean;
  readonly doc: string;
}

/** Every UI component by its catalog slug, through the React adapter as a user imports it. */
const COMPONENTS = {
  button: SpButton,
  input: SpInput,
  checkbox: SpCheckbox,
  switch: SpSwitch,
  card: SpCard,
  divider: SpDivider,
  'radio-group': SpRadioGroup,
  segmented: SpSegmented,
  tabs: SpTabs,
  slider: SpSlider,
  rate: SpRate,
  steps: SpSteps,
  tag: SpTag,
  badge: SpBadge,
  progress: SpProgress,
  alert: SpAlert,
  skeleton: SpSkeleton,
  surface: SpSurface,
  table: SpTable,
  pagination: SpPagination,
  breadcrumb: SpBreadcrumb,
  avatar: SpAvatar,
  statistic: SpStatistic,
  descriptions: SpDescriptions,
  'timeline-list': SpTimelineList,
  empty: SpEmpty,
  result: SpResult,
  textarea: SpTextarea,
  'input-number': SpInputNumber,
  modal: SpModal,
  drawer: SpDrawer,
  popover: SpPopover,
  tooltip: SpTooltip,
  select: SpSelect,
  'dropdown-menu': SpDropdownMenu,
  toast: SpToast,
} as unknown as Readonly<Record<string, ComponentType<Record<string, unknown>>>>;

/** A `Record` over `UiGroup`: a new group fails the build until it has a title here. */
const GROUP_TITLES: Readonly<Record<UiGroup, string>> = {
  actions: 'Actions',
  'data-entry': 'Data entry',
  navigation: 'Navigation',
  'data-display': 'Data display',
  feedback: 'Feedback',
  'building-blocks': 'Building blocks',
  disclosure: 'Disclosure',
  overlays: 'Overlays',
};

/** Each family's gallery (REQ-332, REQ-521): a `Record` over `UiFamily`, so a new family needs a page. */
export const FAMILIES: Readonly<Record<UiFamily, { readonly route: string; readonly title: string; readonly intro: string }>> = {
  ui: {
    route: '/ui',
    title: 'UI components',
    intro: 'components of the UI layer, drawn with the same engraving language as the charts: an exact frame, tone by hatching, keyboard and screen-reader semantics from the native element.',
  },
  composed: {
    route: '/composed',
    title: 'Composed components',
    intro: 'components built from the UI layer’s parts: surfaces and glyphs, tables, lists and disclosure, the longer fields. Each takes the same ground, substrate, mode and palette.',
  },
  overlay: {
    route: '/overlays',
    title: 'Overlays',
    intro: 'components that open over the page from a trigger the consumer writes: native dialogs and popovers, the select and the menu, and the toasts of a toaster.',
  },
};

/** The route of the gallery a component page belongs to: the nav marks it. */
export const familyRouteOf = (slug: string): string | undefined => {
  const entry = UI_COMPONENTS.find((c) => c.slug === slug);
  return entry ? FAMILIES[entry.family].route : undefined;
};

/** The components that bind a `value`: uncontrolled in the docs, so the demo's value is the default. */
const VALUE = new Set(['input', 'checkbox', 'radio-group', 'switch', 'slider', 'rate', 'segmented', 'tabs', 'textarea', 'input-number', 'select']);
/** Props a demo carries that are slots, not attributes: text the component holds or a button it draws. */
const SLOTS = ['content', 'extra', 'footer', 'action'];
/** The overlays drawn closed behind their trigger; a toast is shown in place, in its toaster. */
const CLOSED = new Set(['modal', 'drawer', 'popover', 'tooltip', 'select', 'dropdown-menu']);
/** Docs toasts stay until dismissed: a reader is not timed (WCAG 2.2.1). */
const TOASTER = { duration: Infinity } as const;

type CollapseDemoItem = Record<string, unknown> & { readonly key: string; readonly title: string; readonly content?: string; readonly open?: boolean };

/**
 * A demo state split as the adapters bind it: attributes, the default value, the slot text, the
 * trigger's label. An overlay starts closed and what opens starts open uncontrolled, as on a page.
 */
function parts(slug: string, state: string) {
  const attrs: Record<string, unknown> = {};
  const slots: Record<string, string> = {};
  let value: unknown;
  let trigger: string | undefined;
  for (const [key, v] of Object.entries(UI_DEMOS[slug]?.[state] ?? {})) {
    if (SLOTS.includes(key)) slots[key] = v as string;
    else if (key === 'value' && VALUE.has(slug)) value = v;
    else if (key === 'trigger') trigger = v as string;
    // An open list's active item is state; a closed overlay has none.
    else if (key === 'active' || (key === 'open' && CLOSED.has(slug))) continue;
    else if (key === 'open') attrs.defaultOpen = v;
    else if (key === 'current') attrs.defaultCurrent = v;
    else attrs[key] = v;
  }
  return { attrs, slots, value, trigger };
}

const attribute = ([key, v]: [string, unknown]) => (typeof v === 'string' ? `${key}=${JSON.stringify(v)}` : v === true ? key : `${key}={${JSON.stringify(v)}}`);

/** The JSX a consumer writes for a state, from the same data the live example draws (never retyped). */
function jsx(name: string, slug: string, state: string): string {
  const { attrs, slots, value, trigger } = parts(slug, state);
  const { glyphs, avatars, items, ...rest } = attrs as Record<string, unknown> & { glyphs?: readonly string[]; avatars?: readonly Record<string, unknown>[]; items?: unknown };
  if (glyphs) return glyphs.map((glyph) => `<${name} glyph=${JSON.stringify(glyph)} />`).join('\n');
  const written = Object.entries(slug === 'collapse' || avatars ? rest : attrs)
    .filter(([key]) => key !== 'id')
    .map(attribute);
  // The named slots are attributes in React, as the live example passes them.
  for (const slot of ['extra', 'footer', 'action'] as const) if (slots[slot]) written.push(`${slot}=${JSON.stringify(slots[slot])}`);
  if (trigger !== undefined && slug !== 'dropdown-menu') written.push(`trigger={<button type="button">${trigger}</button>}`);
  if (value !== undefined) written.push(typeof value === 'boolean' ? (value ? 'defaultChecked' : '') : `defaultValue={${JSON.stringify(value)}}`);
  if (avatars) {
    const children = avatars.map((avatar) => `  <SpAvatar ${Object.entries(avatar).map(attribute).join(' ')} />`);
    return [`<SpAvatarGroup ${written.join(' ')}>`, ...children, '</SpAvatarGroup>'].join('\n');
  }
  const open = [`<${name}`, ...written.filter(Boolean)].join(' ');
  if (slug === 'collapse') {
    const children = (items as readonly CollapseDemoItem[]).map(({ key: _key, content, open: itemOpen, ...item }) => `  <SpCollapseItem ${[...Object.entries(item).map(attribute), ...(itemOpen ? ['defaultOpen'] : [])].join(' ')}>${content ?? ''}</SpCollapseItem>`);
    return [`${open}>`, ...children, `</${name}>`].join('\n');
  }
  if (slug === 'tabs') return `${open}>\n  {/* one <SpTabPanel value="…"> per item */}\n</${name}>`;
  const element = slots.content ? `${open}>${slots.content}</${name}>` : `${open} />`;
  // A toast is announced from its toaster (REQ-497).
  return slug === 'toast' ? `<SpToaster>\n  ${element}\n</SpToaster>` : element;
}

/** One state drawn live, uncontrolled, as a consumer would write it. */
function Live({ slug, state }: { slug: string; state: string }): ReactNode {
  const { attrs, slots, value, trigger } = parts(slug, state);
  const { glyphs, avatars, items, ...rest } = attrs as Record<string, unknown> & { glyphs?: readonly string[]; avatars?: readonly Record<string, unknown>[]; items?: unknown };
  if (glyphs) return glyphs.map((glyph) => <SpGlyph key={glyph} glyph={glyph as never} />);
  if (avatars) {
    return (
      <SpAvatarGroup {...rest}>
        {avatars.map((avatar, i) => (
          <SpAvatar key={i} {...(avatar as { name: string })} />
        ))}
      </SpAvatarGroup>
    );
  }
  if (slug === 'collapse') {
    return (
      <SpCollapse {...rest}>
        {(items as readonly CollapseDemoItem[]).map(({ key, content, open, ...item }) => (
          <SpCollapseItem key={key} {...item} defaultOpen={open}>
            {content}
          </SpCollapseItem>
        ))}
      </SpCollapse>
    );
  }
  const Component = COMPONENTS[slug]!;
  const bound = value === undefined ? {} : typeof value === 'boolean' ? { defaultChecked: value } : { defaultValue: value };
  const named = {
    ...(slots.extra ? { extra: slots.extra } : {}),
    ...(slots.footer ? { footer: slots.footer } : {}),
    ...(slots.action ? { action: slots.action } : {}),
    // An overlay hangs from the consumer's trigger; the menu draws its own button.
    ...(trigger !== undefined && slug !== 'dropdown-menu' ? { trigger: <button type="button">{trigger}</button> } : {}),
  };
  const tabs = attrs.items as { key: string; label: string }[] | undefined;
  const children =
    slug === 'tabs' && tabs
      ? tabs.map((tab) => (
          <SpTabPanel key={tab.key} value={tab.key}>
            {tab.label}: the charts of this view.
          </SpTabPanel>
        ))
      : slots.content;
  const element = (
    <Component {...attrs} {...bound} {...named}>
      {children}
    </Component>
  );
  return slug === 'toast' ? (
    <SpToaster {...TOASTER} label={`Notifications · ${state}`}>
      {element}
    </SpToaster>
  ) : (
    element
  );
}

/** A family's components, by group, each drawn in its first state and linking to its page (REQ-332, REQ-521). */
export function UiGallery({ family }: { family: UiFamily }) {
  const { title, intro } = FAMILIES[family];
  const rows = UI_COMPONENTS.filter((c) => c.family === family);
  const groups = (Object.entries(GROUP_TITLES) as [UiGroup, string][]).filter(([group]) => rows.some((c) => c.group === group));
  return (
    <>
      <h2>{title}</h2>
      <p>
        The {rows.length} {intro}
      </p>
      {groups.map(([group, groupTitle]) => (
        <section key={group} aria-labelledby={`group-${group}`}>
          <h3 id={`group-${group}`}>{groupTitle}</h3>
          <ul className="gallery">
            {rows
              .filter((c) => c.group === group)
              .map(({ name, slug, states }) => (
                <li key={slug} className="card" data-component={slug}>
                  <form className="ui-sample" onSubmit={(e) => e.preventDefault()}>
                    <Live slug={slug} state={states[0]!} />
                  </form>
                  <a href={`#/ui/${slug}`}>
                    {name} <span className="visually-hidden">— props and usage</span>
                  </a>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </>
  );
}

/** One component: a live example and its code per declared state, then its props from the types. */
export function UiPage({ slug }: { slug: string }) {
  const entry = UI_COMPONENTS.find((c) => c.slug === slug);
  if (!entry) {
    return (
      <>
        <h2>No such component</h2>
        <p>
          <a href="#/ui">Back to the UI components</a>
        </p>
      </>
    );
  }
  const { name, component, states, family } = entry;
  const gallery = FAMILIES[family];
  const own = (reference.ui.components.find((c) => c.slug === slug)?.own ?? []) as readonly PropDoc[];
  return (
    <>
      <h2>{name}</h2>
      <p>
        <code>import {'{'} {component} {'}'} from '@silverpoint/react/ui/{slug}'</code>, and the same name from{' '}
        <code>@silverpoint/vue/ui/{slug}</code> and <code>@silverpoint/angular/ui/{slug}</code>.
      </p>
      <h3>States</h3>
      {states.map((state) => (
        <section key={state} data-state={state} aria-labelledby={`state-${state}`}>
          <h4 id={`state-${state}`}>{state}</h4>
          <form className="card ui-sample" onSubmit={(e) => e.preventDefault()}>
            <Live slug={slug} state={state} />
          </form>
          <pre>
            <code>{jsx(component, slug, state)}</code>
          </pre>
        </section>
      ))}
      <h3 id="own-props">Its own props</h3>
      <PropsTable className="props" labelledBy="own-props" props={own} />
      <h3 id="common-props">Props every component takes</h3>
      <PropsTable className="props-common" labelledBy="common-props" props={reference.ui.common as readonly PropDoc[]} />
      <p>
        The value binds the way each framework does it: <code>value</code> with <code>onChange</code> or{' '}
        <code>defaultValue</code> in React, <code>v-model</code> in Vue, <code>[(value)]</code> or any forms directive in
        Angular.
      </p>
      <p>
        <a href={`#${gallery.route}`}>Back to {gallery.title}</a>
      </p>
    </>
  );
}

export function PropsTable({ className, labelledBy, props }: { className: string; labelledBy: string; props: readonly PropDoc[] }) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-labelledby={labelledBy}>
      <table className={className}>
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type</th>
            <th scope="col">What it does</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name}>
              <th scope="row">
                <code>
                  {p.name}
                  {p.optional ? '?' : ''}
                </code>
              </th>
              <td>
                <code>{p.type}</code>
              </td>
              <td>{p.doc || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
