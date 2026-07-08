import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { noAuthGuard } from './auth/guards/no-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/pages/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home-portfolio', pathMatch: 'full' },
      {
        path: 'home-portfolio',
        loadComponent: () =>
          import('./dashboard/pages/home-portfolio/home-portfolio.component').then(
            (m) => m.HomePortfolioComponent,
          ),
      },
      {
        path: 'assets',
        loadComponent: () =>
          import('./dashboard/pages/assets/assets.component').then(
            (m) => m.AssetsComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./dashboard/pages/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },

      {
        path: 'flow-diagram',
        loadComponent: () =>
          import('./dashboard/pages/flow-diagram/flow-diagram.component').then(
            (m) => m.FlowDiagramComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
