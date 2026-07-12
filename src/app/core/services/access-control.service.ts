import { Injectable } from '@angular/core';

import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AccessControlService {
  constructor(private readonly authService: AuthService) {}

  can(permission: string): boolean {
    const normalizedPermission = this.normalizePermission(permission);
    const permissions = this.getPermissions();

    return permissions.includes(normalizedPermission);
  }

  canAny(permissions: string[]): boolean {
    return permissions.some((permission) => this.can(permission));
  }

  hasAnyRole(roles: string[]): boolean {
    const allowedRoles = roles.map((role) => this.normalizeRole(role));
    const userRoles = this.getRoles();

    return userRoles.some((role) => allowedRoles.includes(role));
  }

  isAdminConsoleUser(): boolean {
    return this.hasAnyRole(['ADMIN', 'MANAGER', 'DELIVERY']);
  }

  private getPermissions(): string[] {
    const user = this.authService.getCurrentUser();
    return (user?.permissions ?? []).map((permission) => this.normalizePermission(permission));
  }

  private getRoles(): string[] {
    const user = this.authService.getCurrentUser();
    return (user?.roles ?? []).map((role) => this.normalizeRole(role));
  }

  private normalizeRole(role: string): string {
    return role.toUpperCase().replace(/^ROLE_/, '');
  }

  private normalizePermission(permission: string): string {
    return permission.toUpperCase().replace(/^PERM_/, '');
  }
}

