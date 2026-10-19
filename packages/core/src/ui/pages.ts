import { diagnose } from '../diagnostics/diagnose';

/** A page number, or a gap where pages are left out. */
export type UiPageEntry = number | 'start-gap' | 'end-gap';

export interface UiPagination {
  /** Number of pages, at least 1. */
  readonly count: number;
  /** The current page as drawn, 1-based. */
  readonly current: number;
  /** First and last item shown, 1-based; 0 and 0 when there are none. */
  readonly start: number;
  readonly end: number;
  /** An input was not drawable as given. */
  readonly corrected: boolean;
}

function warn(component: string, property: string, message: string): void {
  if (process.env.NODE_ENV !== 'production') diagnose('SP017', component, { property, message });
}

/**
 * The pages a pagination shows (REQ-476, Data Model §2.27): the first, a gap, a window of
 * `siblings` on each side of `current`, a gap, the last.
 */
export function uiPageWindow(count: number, current: number, siblings: number): readonly UiPageEntry[] {
  const first = Math.max(2, current - siblings);
  const last = Math.min(count - 1, current + siblings);
  const pages: UiPageEntry[] = [1];
  if (first > 2) pages.push('start-gap');
  for (let page = first; page <= last; page++) pages.push(page);
  if (last < count - 1) pages.push('end-gap');
  if (count > 1) pages.push(count);
  return pages;
}

/** Pages, the corrected current page and the `start–end of total` numbers; corrections warn `SP017` (REQ-486). */
export function uiPagination(total: number, pageSize: number, current: number, component = 'SpPagination'): UiPagination {
  let corrected = false;
  if (!(Number.isInteger(total) && total >= 0)) {
    warn(component, 'total', `${total} is drawn as 0.`);
    [total, corrected] = [0, true];
  }
  if (!(Number.isInteger(pageSize) && pageSize >= 1)) {
    warn(component, 'pageSize', `${pageSize} is drawn as 10.`);
    [pageSize, corrected] = [10, true];
  }
  const count = Math.max(1, Math.ceil(total / pageSize));
  const page = Number.isFinite(current) ? Math.min(Math.max(Math.round(current), 1), count) : 1;
  if (page !== current) {
    warn(component, 'current', `${current} is drawn as ${page}.`);
    corrected = true;
  }
  return { count, current: page, start: total ? (page - 1) * pageSize + 1 : 0, end: Math.min(total, page * pageSize), corrected };
}
