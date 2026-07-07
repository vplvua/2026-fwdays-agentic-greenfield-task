import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () =>
      import('./features/home/home.routes').then((m) => m.homeRoutes),
  },
];
