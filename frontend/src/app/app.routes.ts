import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { unauthGuard } from './guards/unauth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.Home),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login').then(m => m.LoginComponent),
    canActivate: [unauthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/components/register/register').then(m => m.RegisterComponent),
    canActivate: [unauthGuard]
  },
  {
    path: 'profile/:username',
    loadComponent: () => import('./features/profile/components/profile').then(m => m.Profile),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/profile/settings/settings').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
