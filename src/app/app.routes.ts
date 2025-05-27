import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guards'; // Crear este guard

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [AuthGuard] // Proteger la ruta del chat
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];