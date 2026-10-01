import { UI_COMPONENTS, type UiGroup } from '@silverpoint/core/ui';
import { UI_DEMOS } from '@silverpoint/core/ui-demos';
import { SpAlert, SpBadge, SpButton, SpCard, SpCheckbox, SpDivider, SpInput, SpProgress, SpRadioGroup, SpRate, SpSegmented, SpSkeleton, SpSlider, SpSteps, SpSwitch, SpTabPanel, SpTabs, SpTag } from '@silverpoint/react/ui';
import type { ComponentType, ReactNode } from 'react';
import reference from '../../generated/props.json';

interface PropDoc {
  readonly name: string;
  readonly type: string;
  readonly optional: boolean;
  readonly doc: string;
}

/** Every UI component by its catalog slug, through the React adapter as a user imports it. */
const COMPONENTS = { button: SpButton, input: SpInput, checkbox: SpCheckbox, switch: SpSwitch, card: SpCard, divider: SpDivider, 'radio-group': SpRadioGroup, segmented: SpSegmented, tabs: SpTabs, slider: SpSlider, rate: SpRate, steps: SpSteps, tag: SpTag, badge: SpBadge, progress: SpProgress, alert: SpAlert, skeleton: SpSkeleton } as unknown as Readonly<Record<string, ComponentType<Record<string, unknown>>>>;

/** A `Record` over `UiGroup`: a new group fails the build until it has a title here. */
const GROUP_TITLES: Readonly<Record<UiGroup, string>> = {
  actions: 'Actions',
  'data-entry': 'Data entry',
  navigation: 'Navigation',
  'data-display': 'Data display',
  feedback: 'Feedback',
};
const GROUPS = Object.entries(GROUP_TITLES) as [UiGroup, string][];

/** The components that bind a `value`: uncontrolled in the docs, so the demo's value is the default. */
const VALUE = new Set(['input', 'checkbox', 'radio-group', 'switch', 'slider', 'rate', 'segmented', 'tabs']);
/** Props a demo carries that are slots, not attributes: text the component holds. */
const SLOTS = ['content', 'extra'];

/** A demo state split as the adapters bind it: attributes, the default value, the slot text. */
function parts(slug: string, state: string) {
  const attrs: Record<string, unknown> = {};
  const slots: Record<string, string> = {};
  let value: unknown;
  for (const [key, v] of Object.entries(UI_DEMOS[slug]?.[state] ?? {})) {
    if (SLOTS.includes(key)) slots[key] = v as string;
    else if (key === 'value' && VALUE.has(slug)) value = v;
    else attrs[key] = v;
  }
  return { attrs, slots, value };
}

/** The JSX a consumer writes for a state, from the same data the live example draws (never retyped). */
function jsx(name: string, slug: string, state: string): string {
  const { attrs, slots, value } = parts(slug, state);
  const written = Object.entries(attrs)
    .filter(([key]) => key !== 'id')
    .map(([key, v]) => (typeof v === 'string' ? `${key}=${JSON.stringify(v)}` : v === true ? key : `${key}={${JSON.stringify(v)}}`));
  // The `extra` slot is an attribute in React, as the live example passes it.
  if (slots.extra) written.push(`extra=${JSON.stringify(slots.extra)}`);
  if (value !== undefined) written.push(typeof value === 'boolean' ? (value ? 'defaultChecked' : '') : `defaultValue={${JSON.stringify(value)}}`);
  const open = [`<${name}`, ...written.filter(Boolean)].join(' ');
  if (slug === 'tabs') return `${open}>\n  {/* one <SpTabPanel value="…"> per item */}\n</${name}>`;
  return slots.content ? `${open}>${slots.content}</${name}>` : `${open} />`;
}

/** One state drawn live, uncontrolled, as a consumer would write it. */
function Live({ slug, state }: { slug: string; state: string }): ReactNode {
  const Component = COMPONENTS[slug]!;
  const { attrs, slots, value } = parts(slug, state);
  const bound = value === undefined ? {} : typeof value === 'boolean' ? { defaultChecked: value } : { defaultValue: value };
  const items = attrs.items as { key: string; label: string }[] | undefined;
  const children =
    slug === 'tabs' && items
      ? items.map((tab) => (
          <SpTabPanel key={tab.key} value={tab.key}>
            {tab.label}: the charts of this view.
          </SpTabPanel>
        ))
      : slots.content;
  return (
    <Component {...attrs} {...bound} {...(slots.extra ? { extra: slots.extra } : {})}>
      {children}
    </Component>
  );
}

/** The 17 components, by group, each drawn in its first state and linking to its page (REQ-332). */
export function UiGallery() {
  return (
    <>
      <h2>UI components</h2>
      <p>
        The {UI_COMPONENTS.length} components of the UI layer, drawn with the same engraving language as the charts: an
        exact frame, tone by hatching, keyboard and screen-reader semantics from the native element.
      </p>
      {GROUPS.map(([group, title]) => (
        <section key={group} aria-labelledby={`group-${group}`}>
          <h3 id={`group-${group}`}>{title}</h3>
          <ul className="gallery">
            {UI_COMPONENTS.filter((c) => c.group === group).map(({ name, slug, states }) => (
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
  const { name, component, states } = entry;
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
        <a href="#/ui">Back to the UI components</a>
      </p>
    </>
  );
}

function PropsTable({ className, labelledBy, props }: { className: string; labelledBy: string; props: readonly PropDoc[] }) {
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
