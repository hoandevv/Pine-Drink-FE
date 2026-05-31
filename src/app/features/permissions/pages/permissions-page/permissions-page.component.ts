import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AccessControlService } from '../../../../core/services/access-control.service';
import { PermissionDefinition, PermissionService, RolePermissionMatrix } from '../../services/permission.service';

interface PermissionGroup {
  module: string;
  permissions: PermissionDefinition[];
}

@Component({
  selector: 'app-permissions-page',
  templateUrl: './permissions-page.component.html',
  styleUrls: ['./permissions-page.component.scss']
})
export class PermissionsPageComponent implements OnInit {
  permissions: PermissionDefinition[] = [];
  roles: RolePermissionMatrix[] = [];
  groups: PermissionGroup[] = [];
  selectedRole = 'MANAGER';
  selectedModule = 'ALL';
  savingRole: string | null = null;
  successMessage = '';

  readonly dangerousPermissions = new Set([
    'ACCOUNT_CHANGE_STATUS',
    'ACCOUNT_RESET_PASSWORD',
    'ACCOUNT_ROLE_ASSIGN',
    'ACCOUNT_ROLE_REVOKE',
    'BRANCH_DELETE'
  ]);

  constructor(
    private readonly permissionService: PermissionService,
    public readonly accessControl: AccessControlService
  ) {}

  ngOnInit(): void {
    forkJoin({
      permissions: this.permissionService.getPermissions(),
      roles: this.permissionService.getRolePermissionMatrix()
    }).subscribe(({ permissions, roles }) => {
      this.permissions = permissions;
      this.roles = roles;
      this.groups = this.buildGroups(permissions);
    });
  }

  get selectedRoleData(): RolePermissionMatrix | undefined {
    return this.roles.find((role) => role.role === this.selectedRole);
  }

  get moduleOptions(): string[] {
    return ['ALL', ...this.groups.map((group) => group.module)];
  }

  get visibleGroups(): PermissionGroup[] {
    if (this.selectedModule === 'ALL') {
      return this.groups;
    }

    return this.groups.filter((group) => group.module === this.selectedModule);
  }

  get totalAssigned(): number {
    return this.roles.reduce((total, role) => total + role.permissions.length, 0);
  }

  get highRiskCount(): number {
    return this.permissions.filter((permission) => permission.risk === 'HIGH').length;
  }

  hasPermission(role: RolePermissionMatrix, permissionCode: string): boolean {
    return role.permissions.includes(permissionCode);
  }

  canEditRole(role: RolePermissionMatrix): boolean {
    return !role.locked && this.accessControl.canAny(['ACCOUNT_ROLE_ASSIGN', 'ACCOUNT_ROLE_REVOKE']);
  }

  togglePermission(role: RolePermissionMatrix, permissionCode: string): void {
    if (!this.canEditRole(role)) {
      return;
    }

    const permissions = new Set(role.permissions);
    if (permissions.has(permissionCode)) {
      permissions.delete(permissionCode);
    } else {
      permissions.add(permissionCode);
    }

    role.permissions = Array.from(permissions);
    this.successMessage = '';
  }

  saveRole(role: RolePermissionMatrix): void {
    if (!this.canEditRole(role)) {
      return;
    }

    this.savingRole = role.role;
    this.permissionService.saveRolePermissions(role.role, role.permissions).subscribe({
      next: (updatedRole) => {
        role.permissions = updatedRole.permissions;
        this.successMessage = `Đã lưu quyền cho ${role.label}.`;
        this.savingRole = null;
      },
      error: () => {
        this.savingRole = null;
      }
    });
  }

  resetManagerSafePreset(): void {
    const manager = this.roles.find((role) => role.role === 'MANAGER');
    if (!manager || !this.canEditRole(manager)) {
      return;
    }

    manager.permissions = manager.permissions.filter((permission) => !this.dangerousPermissions.has(permission));
    if (!manager.permissions.includes('BRANCH_UPDATE')) {
      manager.permissions.push('BRANCH_UPDATE');
    }
    this.selectedRole = 'MANAGER';
    this.successMessage = 'Đã áp preset an toàn cho Quản lý. Bấm Lưu để ghi nhận.';
  }

  riskLabel(risk: PermissionDefinition['risk']): string {
    const labels: Record<PermissionDefinition['risk'], string> = {
      LOW: 'Thấp',
      MEDIUM: 'Vừa',
      HIGH: 'Cao'
    };
    return labels[risk];
  }

  private buildGroups(permissions: PermissionDefinition[]): PermissionGroup[] {
    const groupMap = permissions.reduce((map, permission) => {
      const group = map.get(permission.module) ?? [];
      group.push(permission);
      map.set(permission.module, group);
      return map;
    }, new Map<string, PermissionDefinition[]>());

    return Array.from(groupMap.entries()).map(([module, items]) => ({ module, permissions: items }));
  }
}
