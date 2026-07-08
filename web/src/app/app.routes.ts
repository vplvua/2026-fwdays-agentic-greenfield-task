import { Route } from '@angular/router';
import { authGuard } from './core/auth-guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/home/home.routes').then((m) => m.homeRoutes),
  },
];
