/**
 * REQ-671 (delta-018, #27): React's dashboard root provides the provider configuration it read to the
 * dashboard's charts. Under Next.js `cacheComponents` (production), a provider change made while the
 * dashboard's segment is hidden re-rendered the root on reveal but never its charts; providing the
 * value from the root makes React propagate the change from there. The bug needs Next.js's segment
 * cache to show, so this test holds the structure that fixes it.
 */
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { SilverpointProvider } from '../src';
import { SilverpointContext } from '../src/context';
import { DashboardRoot, type DashboardRootProps } from '../src/dashboard-link';

/** What `DashboardRoot` returns under a provider, and the provider value it read. */
function rootUnder(ground: 'silverpoint' | 'cyanotype', props: Partial<DashboardRootProps> = {}) {
  let returned: ReactElement | undefined;
  let read: unknown;
  function Probe() {
    returned = DashboardRoot({ attrs: { children: <span id="chart" /> }, own: {}, layout: {}, ...props }) as ReactElement;
    return null;
  }
  function Reader({ children }: { children: ReactNode }) {
    return <SilverpointContext.Consumer>{(value) => ((read = value), children)}</SilverpointContext.Consumer>;
  }
  renderToStaticMarkup(
    <SilverpointProvider ground={ground}>
      <Reader>
        <Probe />
      </Reader>
    </SilverpointProvider>,
  );
  return { returned: returned!, read };
}

describe('DashboardRoot provides the provider to its charts (REQ-671, #27)', () => {
  test('REQ-671 · the section holds a SilverpointContext provider with the value the root read', () => {
    const { returned, read } = rootUnder('cyanotype');
    const inner = (returned.props as { children: ReactNode }).children;
    expect(isValidElement(inner)).toBe(true);
    const provider = inner as ReactElement<{ value: unknown }>;
    expect([SilverpointContext, SilverpointContext.Provider]).toContain(provider.type);
    expect(provider.props.value).toBe(read);
    expect((provider.props.value as { ground?: string }).ground).toBe('cyanotype');
  });

  test('REQ-671 · a linked dashboard keeps its link inside the provided value', () => {
    const { returned } = rootUnder('silverpoint', { link: { key: 'hour' } as DashboardRootProps['link'] });
    const provider = (returned.props as { children: ReactElement<{ children: ReactElement }> }).children;
    expect([SilverpointContext, SilverpointContext.Provider]).toContain(provider.type);
    expect((provider.props.children.type as { name?: string }).name).toBe('DashboardLink');
  });
});
