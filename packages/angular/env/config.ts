import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { ProviderConfig } from '@silverpoint/core';

/** Application-wide configuration; a chart input always wins over it (API Spec §5.1). */
export const SILVERPOINT_CONFIG = new InjectionToken<ProviderConfig>('SILVERPOINT_CONFIG');

/** Sets ground, substrate, mode and locale once for the application (API Spec §8.2). */
export function provideSilverpoint(config: ProviderConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SILVERPOINT_CONFIG, useValue: config }]);
}
