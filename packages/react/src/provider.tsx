import type { ProviderConfig } from '@silverpoint/core';
import type { ReactNode } from 'react';
import { SilverpointContext } from './context';

export interface SilverpointProviderProps extends ProviderConfig {
  readonly children?: ReactNode;
}

/** Sets ground, substrate, mode and locale once for every chart below it (API Spec §8.1). */
export function SilverpointProvider({ children, ...config }: SilverpointProviderProps) {
  return <SilverpointContext.Provider value={config}>{children}</SilverpointContext.Provider>;
}
