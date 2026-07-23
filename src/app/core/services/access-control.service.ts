import { Injectable } from '@angular/core';

import { AuthService } from './auth.service';

/**
 * Service kiểm tra quyền ở frontend.
 *
 * Nguồn dữ liệu:
 * - roles: lấy từ JWT, được AuthService giữ trong RAM qua currentUserSubject
 * - permissions: lấy từ backend, sau đó AuthService giữ trong RAM qua currentUserSubject
 *
 * Service này không đọc trực tiếp localStorage/sessionStorage.
 */
@Injectable({
  providedIn: 'root'
})
export class AccessControlService {
  constructor(private readonly authService: AuthService) {}

  /**
   * Kiểm tra user có đúng 1 permission hay không.
   */
  can(permission: string): boolean {
    const requiredPermission = this.normalizePermission(permission);
    const currentPermissions = this.getCurrentPermissions();

    return currentPermissions.includes(requiredPermission);
  }

  /**
   * Kiểm tra user có ít nhất 1 permission trong danh sách hay không.
   */
  canAny(permissions: string[]): boolean {
    for (const permission of permissions) {
      if (this.can(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Kiểm tra user có tất cả permissions trong danh sách hay không.
   */
  canAll(permissions: string[]): boolean {
    for (const permission of permissions) {
      if (!this.can(permission)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Kiểm tra user có đúng 1 role hay không.
   */
  hasRole(role: string): boolean {
    const requiredRole = this.normalizeRole(role);
    const currentRoles = this.getCurrentRoles();

    return currentRoles.includes(requiredRole);
  }

  /**
   * Kiểm tra user có ít nhất 1 role trong danh sách hay không.
   */
  hasAnyRole(roles: string[]): boolean {
    for (const role of roles) {
      if (this.hasRole(role)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Kiểm tra user có tất cả roles trong danh sách hay không.
   */
  hasAllRoles(roles: string[]): boolean {
    for (const role of roles) {
      if (!this.hasRole(role)) {
        return false;
      }
    }

    return true;
  }

  /**
   * User được phép vào admin console nếu thuộc nhóm vận hành.
   */
  isAdminConsoleUser(): boolean {
    return this.hasAnyRole(['ADMIN', 'MANAGER', 'DELIVERY']);
  }

  /**
   * Permissions hiện tại lấy từ RAM trong AuthService.
   */
  private getCurrentPermissions(): string[] {
    const currentUser = this.authService.getCurrentUser();
    const permissions = currentUser?.permissions ?? [];

    return permissions.map((permission) => this.normalizePermission(permission));
  }

  /**
   * Roles hiện tại lấy từ RAM trong AuthService.
   */
  private getCurrentRoles(): string[] {
    const currentUser = this.authService.getCurrentUser();
    const roles = currentUser?.roles ?? [];

    return roles.map((role) => this.normalizeRole(role));
  }

  private normalizeRole(role: string): string {
    return role.toUpperCase().replace(/^ROLE_/, '');
  }

  private normalizePermission(permission: string): string {
    return permission.toUpperCase().replace(/^PERM_/, '');
  }
}