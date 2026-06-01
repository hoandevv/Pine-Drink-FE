import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { ClientLayoutComponent } from './layout/client-layout/client-layout.component';

const routes: Routes = [
  {
    path: '',
    component: ClientLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./features/client/client.module').then((m) => m.ClientModule)
      }
    ]
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule)
      }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'orders' },
      {
        path: 'dashboard',
        data: { roles: ['ADMIN', 'MANAGER', 'DELIVERY'] },
        loadChildren: () => import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule)
      },
      {
        path: 'products',
        data: { roles: ['ADMIN', 'MANAGER'] },
        loadChildren: () => import('./features/products/products.module').then((m) => m.ProductsModule)
      },
      {
        path: 'branches',
        data: { permission: 'BRANCH_VIEW' },
        loadChildren: () => import('./features/branches/branches.module').then((m) => m.BranchesModule)
      },
      {
        path: 'categories',
        data: { roles: ['ADMIN', 'MANAGER'] },
        loadChildren: () => import('./features/categories/categories.module').then((m) => m.CategoriesModule)
      },
      {
        path: 'toppings',
        data: { roles: ['ADMIN', 'MANAGER'] },
        loadChildren: () => import('./features/toppings/toppings.module').then((m) => m.ToppingsModule)
      },
      {
        path: 'orders',
        data: { roles: ['ADMIN', 'MANAGER', 'DELIVERY'] },
        loadChildren: () => import('./features/orders/orders.module').then((m) => m.OrdersModule)
      },
      {
        path: 'customers',
        data: { roles: ['ADMIN', 'MANAGER'] },
        loadChildren: () => import('./features/customers/customers.module').then((m) => m.CustomersModule)
      },
      {
        path: 'accounts',
        data: { permission: 'ACCOUNT_VIEW' },
        loadChildren: () => import('./features/accounts/accounts.module').then((m) => m.AccountsModule)
      },
      {
        path: 'permissions',
        data: { permission: 'ROLE_PERMISSION_VIEW' },
        loadChildren: () => import('./features/permissions/permissions.module').then((m) => m.PermissionsModule)
      },
      {
        path: 'vouchers',
        data: { roles: ['ADMIN', 'MANAGER'] },
        loadChildren: () => import('./features/vouchers/vouchers.module').then((m) => m.VouchersModule)
      },
      {
        path: 'reports',
        data: { roles: ['ADMIN', 'MANAGER'] },
        loadChildren: () => import('./features/reports/reports.module').then((m) => m.ReportsModule)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      preloadingStrategy: PreloadAllModules
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
