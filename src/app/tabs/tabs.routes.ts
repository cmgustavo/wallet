import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import {BackupPage} from "../backup/backup.page";
import {AddressPage} from "../address/address.page";
import {TransactionPage} from "../transaction/transaction.page";

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'receive',
        loadComponent: () =>
          import('../receive/receive.page').then((m) => m.ReceivePage),
      },
      {
        path: 'send',
        loadComponent: () =>
          import('../send/send.page').then((m) => m.SendPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'settings/backup',
        children: [
          {
            path: '',
            component: BackupPage,
          },
        ],
      },
      {
        path: 'settings/address',
        children: [
          {
            path: '',
            component: AddressPage,
          }
        ],
      },
      {
        path: 'settings/transaction',
        children: [
          {
            path: '',
            component: TransactionPage,
          }
        ],
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
