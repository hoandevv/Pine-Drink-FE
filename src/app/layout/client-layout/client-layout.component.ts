import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AccessControlService } from '../../core/services/access-control.service';

@Component({
  selector: 'app-client-layout',
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent {

  readonly cartCount = 2;
  readonly cartTotal = 84000;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly accessControl: AccessControlService
  ) {}


  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get isAdmin(): boolean {
    return this.accessControl.isAdminConsoleUser();
  }

  get isChatPage(): boolean {
    return this.router.url.startsWith('/chat');
  }

  get chatQueryParams(): { branchId?: string } {
    const branchId = sessionStorage.getItem('selectedBranchId') || undefined;
    return branchId ? { branchId } : {};
  }

  get userDisplayName(): string {
    const user = this.authService.getCurrentUser();
    return user?.fullName || user?.username || user?.email || 'Tài khoản';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

