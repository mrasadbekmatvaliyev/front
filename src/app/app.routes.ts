// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { HomeComponent } from './home/home';

export const routes: Routes = [
  { path: '', redirectTo: 'login1', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
];
