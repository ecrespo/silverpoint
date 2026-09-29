import { useCallback, useEffect, useRef, type ForwardedRef } from 'react';

/** One ref for the native checkbox: the consumer's, and ours for the `indeterminate` property. */
export function useNativeRef(forwarded: ForwardedRef<HTMLInputElement>, indeterminate: boolean): (node: HTMLInputElement | null) => void {
  const own = useRef<HTMLInputElement | null>(null);
  // `indeterminate` is a property, not an attribute: set after hydration, so both renders agree.
  useEffect(() => {
    if (own.current) own.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return useCallback(
    (node: HTMLInputElement | null) => {
      own.current = node;
      if (typeof forwarded === 'function') forwarded(node);
      else if (forwarded) forwarded.current = node;
    },
    [forwarded],
  );
}
