import { provideZonelessChangeDetection, type ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

/**
 * Zoneless, and hydrating the server's markup rather than replacing it (REQ-222). The router has one
 * wildcard route and no component: it exists so the SSR engine serves every path (`/dashboard`),
 * while the app keeps reading its URL itself.
 */
export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideClientHydration(), provideRouter([{ path: '**', children: [] }])],
};
