import type { DashboardCellContext } from '@silverpoint/core';
import { resolveUi, type CommonUiProps, type UiResolved } from '@silverpoint/core/ui';
import { useContext, useState } from 'react';
import { SilverpointContext } from '../context';
import { useForcedPrecision } from '../environment';

/** The internal prop through which a dashboard cell hands its configuration (TD §3.3). */
export interface UiCellProps {
  readonly dashboardCell?: DashboardCellContext;
}

/**
 * Ground, substrate, mode, size and frame of a component: its props, then the dashboard cell, then
 * the provider, then the defaults, with a forced `precision` read after hydration (REQ-311, REQ-123).
 */
export function useUi(props: CommonUiProps, cell: DashboardCellContext | undefined): UiResolved {
  const provider = useContext(SilverpointContext);
  const forcedPrecision = useForcedPrecision();
  return resolveUi(props, { provider, cell: cell?.config, forcedPrecision });
}

/**
 * A value that is controlled when `value` is given and held here otherwise (REQ-322). `set` updates
 * the held value and reports the new one; a controlled component only reports it.
 */
export function useValue<T>(value: T | undefined, initial: T, onChange: ((next: T) => void) | undefined): [T, (next: T) => void] {
  const [held, setHeld] = useState(initial);
  const controlled = value !== undefined;
  return [
    controlled ? value : held,
    (next: T) => {
      if (!controlled) setHeld(next);
      onChange?.(next);
    },
  ];
}

/** Text content, when the children are text: what the accessible-name check reads (REQ-319). */
export function textOf(children: unknown): string | undefined {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return children === undefined || children === null || children === false ? undefined : '·';
}
