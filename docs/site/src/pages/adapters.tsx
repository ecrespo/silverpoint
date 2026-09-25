import { useLayoutEffect, useRef } from 'react';
import parity from '../../generated/parity.json';

const ADAPTERS = [
  ['react', 'React'],
  ['vue', 'Vue'],
  ['angular', 'Angular'],
] as const;

type Adapter = (typeof ADAPTERS)[number][0];
interface ParityEntry {
  readonly id: string;
  readonly chart: string;
  readonly renders: Readonly<Record<Adapter, string>>;
  readonly equal: Readonly<Record<Adapter, boolean>>;
}

/**
 * One fixture rendered by all three adapters (PRD acceptance of REQ-100): each render is the
 * adapter's server output, committed and held current by the string gate (`parity.real.test.ts`).
 */
export function Adapters() {
  return (
    <>
      <h2>One chart, three adapters</h2>
      <p>
        Every adapter is a translation of one render made in the core, never a second implementation. Each fixture below
        was server-rendered by React, Vue and Angular; CI compares each output with the fixture’s canonical render, as a
        parsed tree, with zero tolerance.
      </p>
      {(parity as readonly ParityEntry[]).map((entry) => {
        const identical = ADAPTERS.every(([adapter]) => entry.equal[adapter]);
        return (
          <section key={entry.id} data-fixture={entry.id} aria-labelledby={`fx-${entry.id}`}>
            <h3 id={`fx-${entry.id}`}>{entry.chart}</h3>
            <p>
              Fixture <code>{entry.id}</code>:{' '}
              {identical ? 'the three adapters render identical SVG.' : 'the adapters differ — the string gate fails.'}
            </p>
            <div className="parity">
              {ADAPTERS.map(([adapter, name]) => (
                <figure key={adapter} data-adapter={adapter} className="card">
                  <Markup svg={entry.renders[adapter]} scope={adapter} />
                  <figcaption>{name}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

/**
 * An adapter's committed `<svg>`, parsed inert and adopted as nodes (TD §6: no markup injection).
 * The three renders share the fixture's ids, so each copy's ids are prefixed with its adapter —
 * one page may not repeat an id — along with every reference to them.
 */
function Markup({ svg, scope }: { svg: string; scope: Adapter }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const parsed = new DOMParser().parseFromString(svg, 'text/html').body.firstElementChild;
    if (!parsed || !host.current) return;
    const node = document.importNode(parsed, true);
    const ids = [...node.querySelectorAll('[id]')].map((el) => el.id);
    for (const el of [node, ...node.querySelectorAll('*')]) {
      for (const attr of [...el.attributes]) {
        let value = attr.value;
        for (const id of ids) {
          if (attr.name === 'id' && value === id) value = `${scope}-${id}`;
          value = value.split(`#${id})`).join(`#${scope}-${id})`);
          if (attr.name === 'href' && value === `#${id}`) value = `#${scope}-${id}`;
          if (attr.name.startsWith('aria-')) value = value.split(' ').map((t) => (t === id ? `${scope}-${id}` : t)).join(' ');
        }
        if (value !== attr.value) el.setAttribute(attr.name, value);
      }
    }
    // The ground's tokens are read from the root, as every adapter's own wrapper sets them.
    host.current.dataset.substrate = node.getAttribute('data-substrate') ?? 'cream';
    host.current.replaceChildren(node);
  }, [svg, scope]);
  return <div ref={host} className="sp-root sp-ground-silverpoint" data-status="ready" />;
}
