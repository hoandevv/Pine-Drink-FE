import { Injectable } from '@angular/core';

import { AuthUser } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly accessTokenKey = 'pine_drink_access_token';
  private readonly refreshTokenKey = 'pine_drink_refresh_token';

  setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(this.accessTokenKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  clearTokens(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }

  getCurrentUserFromToken(): AuthUser | null {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    const payload = this.decodeTokenPayload(token);

    if (!payload) {
      return null;
    }

    return {
      id: payload.sub ?? '',
      username: payload.username ?? payload.email ?? 'User',
      email: payload.email ?? '',
      scope: payload.scope ?? null,
      // role lấy từ JWT
      roles: payload.roles ?? [],
      // permission lấy từ backend rồi lưu vào RAM
      permissions: []
    };
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) {
      return false;
    }

    return payload.exp * 1000 <= Date.now();
  }

  private decodeTokenPayload(token: string): { sub?: string; username?: string; email?: string; roles?: string[]; permissions?: string[]; scope?: AuthUser['scope']; exp?: number } | null {
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
