import type { ProviderConfig } from '@silverpoint/core';
import { nestProvider } from '@silverpoint/core/palettes';
import { useContext, type ReactNode } from 'react';
import { SilverpointContext } from './context';

export interface SilverpointProviderProps extends ProviderConfig {
  readonly children?: ReactNode;
}

/**
 * Sets ground, substrate, mode, locale and palette once for every chart and component below it (API
 * Spec §8.1). Inside another provider it scopes a section: its own fields win, the rest are inherited,
 * and the palettes merge field by field (REQ-462).
 */
export function SilverpointProvider({ children, ...config }: SilverpointProviderProps) {
  const outer = useContext(SilverpointContext);
  return <SilverpointContext.Provider value={nestProvider(outer, config)}>{children}</SilverpointContext.Provider>;
}
