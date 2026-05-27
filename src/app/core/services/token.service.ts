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
    return !!this.getAccessToken();
  }

  getCurrentUserFromToken(): AuthUser | null {
    const token = this.getAccessToken();
    if (!token) {
      return this.getStoredUser();
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return this.getStoredUser();
    }

    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
        sub?: string;
        username?: string;
        email?: string;
        roles?: string[];
      };

      return {
        id: payload.sub ?? '',
        username: payload.username ?? payload.email ?? this.getStoredUser()?.username ?? 'User',
        email: payload.email ?? this.getStoredUser()?.email ?? '',
        roles: payload.roles ?? this.getStoredUser()?.roles ?? []
      };
    } catch {
      return this.getStoredUser();
    }
  }
}
