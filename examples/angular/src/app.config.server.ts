import { mergeApplicationConfig, type ApplicationConfig } from '@angular/core';
import { provideServerRendering, RenderMode, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';

/**
 * Every URL is rendered per request: the gates name their fixture in the query string, which a
 * prerendered page cannot see (REQ-222).
 */
export const serverConfig: ApplicationConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(withRoutes([{ path: '**', renderMode: RenderMode.Server }]))],
});
