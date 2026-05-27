import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { AuthUser } from '../../shared/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'DB', route: '/dashboard' },
    { label: 'Products', icon: 'PR', route: '/products' },
    { label: 'Categories', icon: 'CA', route: '/categories' },
    { label: 'Toppings', icon: 'TP', route: '/toppings' },
    { label: 'Orders', icon: 'OD', route: '/orders' },
    { label: 'Customers', icon: 'CU', route: '/customers' },
    { label: 'Accounts', icon: 'AC', route: '/accounts' },
    { label: 'Vouchers', icon: 'VC', route: '/vouchers' },
    { label: 'Reports', icon: 'RP', route: '/reports' }
  ];

  sidebarOpen = false;
  currentUser: AuthUser | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUser = this.authService.getCurrentUser();
        this.sidebarOpen = false;
      });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
