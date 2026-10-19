import { inject, InjectionToken, type Provider } from '@angular/core';
import type { ProviderConfig } from '@silverpoint/core';
import { nestProvider } from '@silverpoint/core/palettes';

/** Application-wide configuration; a chart input always wins over it (API Spec §5.1). */
export const SILVERPOINT_CONFIG = new InjectionToken<ProviderConfig>('SILVERPOINT_CONFIG');

/**
 * Sets ground, substrate, mode, locale and palette once for the application (API Spec §8.2). In a
 * component's or a route's `providers` it scopes a section: its own fields win over the enclosing
 * configuration, the rest are inherited, and the palettes merge field by field (REQ-462).
 */
export function provideSilverpoint(config: ProviderConfig): Provider {
  return {
    provide: SILVERPOINT_CONFIG,
    useFactory: () => nestProvider(inject(SILVERPOINT_CONFIG, { optional: true, skipSelf: true }) ?? undefined, config),
  };
}
