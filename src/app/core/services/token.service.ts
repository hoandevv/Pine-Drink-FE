import { Injectable } from '@angular/core';

import { AuthUser } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly accessTokenKey = 'pine_drink_access_token';
  private readonly refreshTokenKey = 'pine_drink_refresh_token';
  private readonly currentUserKey = 'pine_drink_current_user';

  setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(this.accessTokenKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
  }

  setCurrentUser(user: AuthUser): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getStoredUser(): AuthUser | null {
    const rawUser = localStorage.getItem(this.currentUserKey);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  }

  clearTokens(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.currentUserKey);
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }

  getCurrentUserFromToken(): AuthUser | null {
    const token = this.getAccessToken();
    if (!token) {
      return this.getStoredUser();
    }

    const payload = this.decodeTokenPayload(token);
    const storedUser = this.getStoredUser();

    if (!payload) {
      return storedUser;
    }

    return {
      id: payload.sub ?? storedUser?.id ?? '',
      username: payload.username ?? payload.email ?? storedUser?.username ?? 'User',
      fullName: storedUser?.fullName,
      email: payload.email ?? storedUser?.email ?? '',
      phone: storedUser?.phone,
      dateOfBirth: storedUser?.dateOfBirth,
      gender: storedUser?.gender,
      avatarUrl: storedUser?.avatarUrl,
      status: storedUser?.status,
      authProvider: storedUser?.authProvider,
      hasLocalPassword: storedUser?.hasLocalPassword,
      lastLoginAt: storedUser?.lastLoginAt,
      createdAt: storedUser?.createdAt,
      scope: storedUser?.scope ?? null,
      roles: payload.roles ?? storedUser?.roles ?? [],
      permissions: payload.permissions ?? storedUser?.permissions ?? [],
      permissionsLoadedAt: storedUser?.permissionsLoadedAt
    };
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) {
      return false;
    }

    return payload.exp * 1000 <= Date.now();
  }

  private decodeTokenPayload(token: string): { sub?: string; username?: string; email?: string; roles?: string[]; permissions?: string[]; exp?: number } | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }
}
