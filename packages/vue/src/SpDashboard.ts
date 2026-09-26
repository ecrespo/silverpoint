import { dashboardView, type DashboardProps } from '@silverpoint/core';
import { cloneVNode, Comment, defineComponent, Fragment, h, isVNode, type Slots, type VNode } from 'vue';
import { SpDashboardCell } from './SpDashboardCell';

/** The slot's element nodes, fragments (`v-for`) opened and comments (`v-if`) dropped. */
function elements(nodes: readonly unknown[]): VNode[] {
  return nodes.flatMap((node) => {
    if (!isVNode(node) || node.type === Comment) return [];
    return node.type === Fragment ? elements((node.children as unknown[]) ?? []) : [node];
  });
}

/** The `id` of the chart inside a cell, when its slot gives one: the cell's label points at it. */
function chartIdOf(cell: VNode): string | undefined {
  const [inner] = elements(((cell.children as Slots | null)?.default?.() as unknown[]) ?? []);
  const id = inner?.props?.id;
  return typeof id === 'string' ? id : undefined;
}

const PROPS = ['id', 'title', 'label', 'layout', 'description', 'headingLevel', 'ssrWidth', 'link', 'ground', 'substrate', 'mode', 'locale', 'className'] as const;

/**
 * `SpDashboard` (REQ-200): a declarative grid of cards laid out in the core from a data-only
 * layout (API Spec §7.1). It reads each child's `cell` during render, asks the core's
 * `dashboardView` for every attribute and cell, and computes nothing itself (Art. 2).
 */
export const SpDashboard = defineComponent(
  (props: DashboardProps, { slots }) =>
    () => {
      const given = elements(slots.default?.() ?? []).map((node) => {
        const marked = node.type === SpDashboardCell;
        return { node, cell: marked ? (node.props?.cell as string | undefined) : undefined, id: marked ? chartIdOf(node) : (node.props?.id as string | undefined) };
      });
      const view = dashboardView(props, given.map(({ cell, id }) => ({ cell, id })));
      const { section, heading, description } = view;
      return h(
        'section',
        {
          class: section.className,
          part: 'dashboard',
          'data-substrate': section.substrate,
          'aria-labelledby': section.labelledby,
          'aria-describedby': section.describedby,
          'aria-label': section.label,
          style: section.style,
        },
        [
          heading && h(`h${heading.level}`, { class: 'sp-dashboard-title', part: 'dashboard-title', id: heading.id }, heading.text),
          description && h('p', { class: 'sp-dashboard-description', part: 'dashboard-description', id: description.id }, description.text),
          h(
            'div',
            { class: 'sp-dashboard-grid', part: 'dashboard-grid' },
            view.cells.map((cell) => {
              const { node } = given[cell.child]!;
              return node.type === SpDashboardCell
                ? cloneVNode(node, { view: cell, key: cell.context.chartId })
                : h(SpDashboardCell, { view: cell, key: cell.context.chartId }, () => [node]);
            }),
          ),
        ],
      );
    },
  { name: 'SpDashboard', props: [...PROPS] },
);
