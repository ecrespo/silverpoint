import type { ProviderConfig } from '@silverpoint/core';
import { createContext } from 'react';

/** Application-wide configuration (API Spec §8.1); a chart prop always wins over it. */
export const SilverpointContext = createContext<ProviderConfig>({});
