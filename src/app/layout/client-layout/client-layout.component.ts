import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { AuthUser } from '../../shared/models/user.model';

@Component({
  selector: 'app-client-layout',
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent implements OnInit {
  currentUser$: Observable<AuthUser | null>;
  currentUser: AuthUser | null = null;

  readonly cartCount = 2;
  readonly cartTotal = 84000;

  constructor(
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get isAdmin(): boolean {
    const roles = this.currentUser?.roles ?? [];
    return roles.some((role) => ['ADMIN', 'ROLE_ADMIN'].includes(role.toUpperCase()));
  }

  get displayName(): string {
    return this.currentUser?.fullName || this.currentUser?.username || 'Tài khoản';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

