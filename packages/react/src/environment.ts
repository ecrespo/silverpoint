import { FORCED_PRECISION_QUERY } from '@silverpoint/core';
import { useEffect, useState, type RefObject } from 'react';

/**
 * Whether the environment forces `precision` (REQ-123). Read after hydration, so the server
 * render and the first client render agree (REQ-103).
 */
export function useForcedPrecision(): boolean {
  const [forced, setForced] = useState(false);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia(FORCED_PRECISION_QUERY);
    const update = () => setForced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return forced;
}

/** Width of the container, measured with ResizeObserver; `undefined` until measured (REQ-009). */
export function useMeasuredWidth(ref: RefObject<HTMLElement | null>, enabled: boolean): number | undefined {
  const [width, setWidth] = useState<number | undefined>(undefined);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled]);
  return width;
}
