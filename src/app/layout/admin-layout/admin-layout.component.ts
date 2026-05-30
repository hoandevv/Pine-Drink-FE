import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { AuthUser } from '../../shared/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Products', icon: 'local_cafe', route: '/admin/products' },
    { label: 'Branches', icon: 'storefront', route: '/admin/branches' },
    { label: 'Categories', icon: 'category', route: '/admin/categories' },
    { label: 'Toppings', icon: 'icecream', route: '/admin/toppings' },
    { label: 'Orders', icon: 'receipt_long', route: '/admin/orders', badge: '18' },
    { label: 'Customers', icon: 'groups', route: '/admin/customers' },
    { label: 'Accounts', icon: 'admin_panel_settings', route: '/admin/accounts' },
    { label: 'Vouchers', icon: 'confirmation_number', route: '/admin/vouchers' },
    { label: 'Reports', icon: 'monitoring', route: '/admin/reports' }
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

  getAvatarUrl(): string {
    // Backend now returns full MinIO URLs for public files (avatars)
    // Example: http://localhost:9000/pine-drink-public/avatars/uuid.jpg
    // Use the URL directly as provided by the backend
    return this.currentUser?.avatarUrl || '';
  }

  getUserInitials(): string {
    const name = this.currentUser?.fullName || this.currentUser?.username || 'A';
    return name.charAt(0).toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(`${route}/`);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
