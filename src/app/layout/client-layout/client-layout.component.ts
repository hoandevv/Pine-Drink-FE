import { Component, OnDestroy, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AccessControlService } from '../../core/services/access-control.service';
import { CartService } from '../../features/client/services/cart.service';

@Component({
  selector: 'app-client-layout',
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent implements OnInit, OnDestroy {

  cartCount = 0;
  cartTotal = 0;
  isMobileNavOpen = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly accessControl: AccessControlService,
    private readonly cartService: CartService
  ) {}

  ngOnInit(): void {
    this.cartService.cartCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.cartCount = count);

    this.cartService.cartTotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(total => this.cartTotal = total);

    const branchId = sessionStorage.getItem('selectedBranchId') || '';
    if (branchId && this.isLoggedIn) {
      this.cartService.getActiveCart(branchId).subscribe({ error: () => this.cartService.clearCart() });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  toggleMobileNav(): void {
    this.isMobileNavOpen = !this.isMobileNavOpen;
  }

  closeMobileNav(): void {
    this.isMobileNavOpen = false;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  goToCart(): void {
    this.closeMobileNav();
    this.router.navigate(['/cart']);
  }

  logout(): void {
    this.closeMobileNav();
    this.cartService.clearCart();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

