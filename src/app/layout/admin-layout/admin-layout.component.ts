import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { AccessControlService } from '../../core/services/access-control.service';
import { AuthUser } from '../../shared/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  permission?: string;
  permissions?: string[];
  roles?: string[];
  badge?: string;
  compact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  readonly navSections: NavSection[] = [
    {
      title: 'Tổng quan',
      items: [
        { label: 'Delivery Hub', icon: 'local_shipping', route: '/admin/dashboard', roles: ['DELIVERY'] },
        { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard', roles: ['ADMIN', 'MANAGER'] }
      ]
    },
    {
      title: 'Vận hành',
      items: [
        { label: 'Orders', icon: 'receipt_long', route: '/admin/orders', roles: ['ADMIN', 'MANAGER', 'DELIVERY'] },
        { label: 'Chat Realtime', icon: 'forum', route: '/admin/chat-realtime', roles: ['ADMIN', 'MANAGER', 'DELIVERY'] },
        { label: 'Branches', icon: 'storefront', route: '/admin/branches', permission: 'BRANCH_VIEW' }
      ]
    },
    {
      title: 'Menu',
      items: [
        { label: 'Products', icon: 'local_cafe', route: '/admin/products', roles: ['ADMIN', 'MANAGER'] },
        { label: 'Categories', icon: 'category', route: '/admin/categories', roles: ['ADMIN', 'MANAGER'] }
      ]
    },
    {
      title: 'Cấu hình sản phẩm',
      items: [
        { label: 'Variants', icon: 'tune', route: '/admin/products/variants', roles: ['ADMIN', 'MANAGER'] },
        { label: 'Daily Stocks', icon: 'inventory_2', route: '/admin/products/daily-stocks', roles: ['ADMIN', 'MANAGER'] },
        { label: 'Product Toppings', icon: 'icecream', route: '/admin/products/toppings', roles: ['ADMIN', 'MANAGER'] },
        { label: 'Topping Master', icon: 'bakery_dining', route: '/admin/toppings', roles: ['ADMIN', 'MANAGER'] }
      ]
    },
    {
      title: 'Người dùng & quyền',
      items: [
        { label: 'Customers', icon: 'groups', route: '/admin/customers', roles: ['ADMIN', 'MANAGER'] },
        { label: 'Accounts', icon: 'admin_panel_settings', route: '/admin/accounts', permission: 'ACCOUNT_VIEW' },
        { label: 'Permissions', icon: 'verified_user', route: '/admin/permissions', permission: 'ROLE_PERMISSION_VIEW' }
      ]
    },
    {
      title: 'Kinh doanh',
      items: [
        { label: 'Vouchers', icon: 'confirmation_number', route: '/admin/vouchers', roles: ['ADMIN', 'MANAGER'] },
        { label: 'Reports', icon: 'monitoring', route: '/admin/reports', roles: ['ADMIN', 'MANAGER'] }
      ]
    }
  ];

  get visibleNavSections(): NavSection[] {
    return this.navSections
      .map((section) => ({ ...section, items: section.items.filter((item) => this.canViewNavItem(item)) }))
      .filter((section) => section.items.length > 0);
  }

  sidebarOpen = false;
  sidebarCollapsed = false;
  currentUser: AuthUser | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly accessControl: AccessControlService
  ) {
    this.currentUser = this.authService.getCurrentUser();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUser = this.authService.getCurrentUser();
        this.sidebarOpen = false;
      });
  }

  get isDeliveryOnly(): boolean {
    return this.accessControl.hasAnyRole(['DELIVERY']) && !this.accessControl.hasAnyRole(['ADMIN', 'MANAGER']);
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

  toggleSidebarCollapse(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(`${route}/`);
  }

  private canViewNavItem(item: NavItem): boolean {
    const hasPermissionAccess = item.permission ? this.accessControl.can(item.permission) : true;
    const hasPermissionsAccess = item.permissions?.length ? this.accessControl.canAny(item.permissions) : true;
    const hasRoleAccess = item.roles?.length ? this.accessControl.hasAnyRole(item.roles) : true;
    const deliveryCanSee = !this.isDeliveryOnly || !!item.roles?.includes('DELIVERY');

    return hasPermissionAccess && hasPermissionsAccess && hasRoleAccess && deliveryCanSee;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
