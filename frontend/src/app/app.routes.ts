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
    path: 'profile',
    loadComponent: () => import('./features/profile/components/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
