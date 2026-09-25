import type { ChartRecipe, CommonChartProps } from '@silverpoint/core';
import { CATALOG } from '../../../tools/visual-gate/catalog';
import { renderChart, toSVGString } from '../src';

/** One card per catalog chart: its demo data inside the full card chrome, at the md width. */
export interface RenderCard {
  readonly chart: string;
  readonly recipe: ChartRecipe<CommonChartProps>;
  readonly props: CommonChartProps;
}

export const RENDER_CARDS: readonly RenderCard[] = CATALOG.map(({ chart, recipe }) => ({
  chart,
  recipe,
  props: { title: chart, badge: 'bench', footerLeft: 'demo data', footerRight: 'silverpoint', mode: 'ink', height: 150 },
}));

/**
 * The full initial render of a card (PRD NFR Performance): resolve, build, ink, round, and
 * serialise to SVG — everything but the framework's own DOM work, which Art. 2 keeps thin.
 */
export function renderCard(card: RenderCard): { readonly status: string; readonly svg: string } {
  const rendered = renderChart(card.recipe, card.props, { id: `bench-${card.chart}`, width: 320 });
  return { status: rendered.status, svg: toSVGString(rendered) };
}
