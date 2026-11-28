import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { PaginadorIntl } from './utils/paginador-intl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideCharts(withDefaultRegisterables()),
    { provide: MatPaginatorIntl, useClass: PaginadorIntl }
  ]
};