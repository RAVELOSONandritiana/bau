import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'enabled'
    }), withRouterConfig({
      onSameUrlNavigation: 'reload',
      paramsInheritanceStrategy: 'always'
    }))
  ]
};