import { Injectable } from '@angular/core';

import { TokenService } from './token.service';

export type PermissionCode =
  | 'ACCOUNT_VIEW'
  | 'ACCOUNT_CREATE'
  | 'ACCOUNT_UPDATE'
  | 'ACCOUNT_CHANGE_STATUS'
  | 'ACCOUNT_RESET_PASSWORD'
  | 'ROLE_VIEW'
  | 'PERMISSION_VIEW'
  | 'ROLE_PERMISSION_VIEW'
  | 'ROLE_PERMISSION_UPDATE'
  | 'BRANCH_VIEW'
  | 'BRANCH_CREATE'
  | 'BRANCH_UPDATE'
  | 'BRANCH_DELETE'
  | 'PROFILE_VIEW'
  | 'PROFILE_UPDATE'
  | 'CUSTOMER_ADDRESS_VIEW'
  | 'CUSTOMER_ADDRESS_CREATE'
  | 'CUSTOMER_ADDRESS_UPDATE'
  | 'CUSTOMER_ADDRESS_DELETE'
  | 'FILE_UPLOAD'
  | 'GEOCODING_VIEW';

const ROLE_PERMISSION_FALLBACK: Record<string, PermissionCode[]> = {
  ADMIN: [
    'ACCOUNT_VIEW',
    'ACCOUNT_CREATE',
    'ACCOUNT_UPDATE',
    'ACCOUNT_CHANGE_STATUS',
    'ACCOUNT_RESET_PASSWORD',
    'ROLE_VIEW',
    'PERMISSION_VIEW',
    'ROLE_PERMISSION_VIEW',
    'ROLE_PERMISSION_UPDATE',
    'BRANCH_VIEW',
    'BRANCH_CREATE',
    'BRANCH_UPDATE',
    'BRANCH_DELETE',
    'PROFILE_VIEW',
    'PROFILE_UPDATE',
    'CUSTOMER_ADDRESS_VIEW',
    'CUSTOMER_ADDRESS_CREATE',
    'CUSTOMER_ADDRESS_UPDATE',
    'CUSTOMER_ADDRESS_DELETE',
    'FILE_UPLOAD',
    'GEOCODING_VIEW'
  ],
  MANAGER: [
    'ACCOUNT_VIEW',
    'ROLE_VIEW',
    'PERMISSION_VIEW',
    'ROLE_PERMISSION_VIEW',
    'BRANCH_VIEW',
    'BRANCH_CREATE',
    'BRANCH_UPDATE',
    'PROFILE_VIEW',
    'PROFILE_UPDATE',
    'FILE_UPLOAD',
    'GEOCODING_VIEW'
  ],
  CUSTOMER: [
    'PROFILE_VIEW',
    'PROFILE_UPDATE',
    'CUSTOMER_ADDRESS_VIEW',
    'CUSTOMER_ADDRESS_CREATE',
    'CUSTOMER_ADDRESS_UPDATE',
    'CUSTOMER_ADDRESS_DELETE',
    'FILE_UPLOAD',
    'GEOCODING_VIEW'
  ],
  DELIVERY: ['PROFILE_VIEW', 'PROFILE_UPDATE', 'FILE_UPLOAD', 'GEOCODING_VIEW']
};

@Injectable({ providedIn: 'root' })
export class AccessControlService {
  constructor(private readonly tokenService: TokenService) {}

  can(permission: PermissionCode | string): boolean {
    const normalizedPermission = this.normalizePermission(permission);
    const user = this.tokenService.getCurrentUserFromToken();
    const permissions = (user?.permissions ?? []).map((item) => this.normalizePermission(item));

    if (permissions.length > 0) {
      return permissions.includes(normalizedPermission);
    }

    return this.canByRoleFallback(normalizedPermission);
  }

  canAny(permissions: Array<PermissionCode | string>): boolean {
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

  private canByRoleFallback(permission: string): boolean {
    return this.getRoles().some((role) => ROLE_PERMISSION_FALLBACK[role]?.includes(permission as PermissionCode));
  }

  private getRoles(): string[] {
    const user = this.tokenService.getCurrentUserFromToken();
    return (user?.roles ?? []).map((role) => this.normalizeRole(role));
  }

  private normalizeRole(role: string): string {
    return role.toUpperCase().replace(/^ROLE_/, '');
  }

  private normalizePermission(permission: string): string {
    return permission.toUpperCase().replace(/^PERM_/, '');
  }
}
