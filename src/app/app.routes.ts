import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'create',
    loadComponent: () => import('./create/create.page').then( m => m.CreatePage)
  },
];
