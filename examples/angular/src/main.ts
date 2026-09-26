import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app';
import { appConfig } from './app.config';

bootstrapApplication(App, appConfig)
  .then((ref) => ref.whenStable())
  .then(() => {
    // Hydration is done once the app is stable; the bench waits on this mark.
    document.documentElement.dataset.hydrated = 'true';
  })
  .catch((error: unknown) => console.error(error));
