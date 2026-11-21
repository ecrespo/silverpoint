import { dashboardSection, type DashboardLink as Link, type LinkState, type Palette, type SubstrateName } from '@silverpoint/core';
import { paletteStyle, resolvePalette } from '@silverpoint/core/palettes';
import { useContext, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { SilverpointContext } from './context';
import { DashboardLinkContext } from './link-context';

export interface DashboardLinkProps {
  readonly link: Link;
  /** The linked value changed; `null` when the source cleared (API Spec §9, REQ-218). */
  readonly onLinkChange?: (link: { key: string; value: unknown } | null) => void;
  readonly children?: ReactNode;
}

/**
 * The client boundary of a linked dashboard (REQ-104, REQ-219): the one linked value its charts
 * share. The dashboard's root renders it only when `link` is given; it adds no element of its own.
 */
export function DashboardLink({ link, onLinkChange, children }: DashboardLinkProps) {
  const [state, setState] = useState<LinkState | null>(null);
  const value = useMemo(
    () => ({
      key: link.key,
      state,
      set(next: LinkState | null) {
        setState(next);
        onLinkChange?.(next && { key: next.key, value: next.value });
      },
    }),
    [link.key, state, onLinkChange],
  );
  return <DashboardLinkContext.Provider value={value}>{children}</DashboardLinkContext.Provider>;
}

export interface DashboardRootProps {
  /** The section as the dashboard's props alone give it, its content included. */
  readonly attrs: Readonly<Record<string, unknown>> & { readonly children?: ReactNode };
  /** What the dashboard itself sets; its ground by name, so it crosses a Server Components boundary as data. */
  readonly own: { readonly ground?: string; readonly substrate?: SubstrateName; readonly palette?: Palette; readonly className?: string };
  /** The layout's variables, written after the palette's. */
  readonly layout: Readonly<Record<string, string>>;
  /** A linked dashboard's link: the root then holds the linked value its charts share (REQ-219). */
  readonly link?: Link;
  readonly onLinkChange?: DashboardLinkProps['onLinkChange'];
}

/**
 * The client boundary of a dashboard's root (#17, DD-037 as amended by delta-016): the `section`,
 * under the provider — its ground, substrate and palette where the dashboard sets none. A Server
 * Component reads no context, so `@silverpoint/react/server/dashboard` writes the section itself.
 */
export function DashboardRoot({ attrs, own, layout, link, onLinkChange }: DashboardRootProps) {
  const provider = useContext(SilverpointContext);
  const root = dashboardSection(own, paletteStyle(resolvePalette(provider.palette, own.palette)), layout, provider);
  return (
    <section {...attrs} className={root.className} data-substrate={root.substrate} style={root.style as CSSProperties}>
      {/* The root hands on the value it read (REQ-671, #27): when it re-renders with a new one, React
          propagates the change from here, also into a segment Next.js revealed from its cache. */}
      <SilverpointContext.Provider value={provider}>
        {link ? (
          <DashboardLink link={link} onLinkChange={onLinkChange}>
            {attrs.children}
          </DashboardLink>
        ) : (
          attrs.children
        )}
      </SilverpointContext.Provider>
    </section>
  );
}
