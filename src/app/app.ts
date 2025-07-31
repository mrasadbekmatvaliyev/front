// src/app/app.component.ts
import { Component } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './navbar/navbar';
import { NotificationComponent } from './notification/notification';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, NavbarComponent, NotificationComponent, CommonModule],
  
  template: `
  <app-navbar *ngIf="!isLoginPage"></app-navbar>
  <router-outlet></router-outlet>
  <app-notification></app-notification>
  `
})
export class AppComponent {
  isLoginPage = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isLoginPage = event.url === '/login';
      });
  }
}
