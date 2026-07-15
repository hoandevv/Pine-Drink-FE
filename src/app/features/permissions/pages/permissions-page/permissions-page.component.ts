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
  filteredGroups: PermissionGroup[] = [];
  selectedRole = 'MANAGER';
  selectedModule = 'ALL';
  savingRole: string | null = null;
  successMessage = '';


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
      this.selectedModule = 'ALL';
      this.applyModuleFilter();

      if (!this.selectedRoleData && roles.length) {
        this.selectedRole = roles[0].role;
      }
    });
  }

  get selectedRoleData(): RolePermissionMatrix | undefined {
    return this.roles.find((role) => role.role === this.selectedRole);
  }

  get moduleOptions(): string[] {
    return ['ALL', ...this.groups.map((group) => group.module)];
  }

  onModuleChange(module: string): void {
    this.selectedModule = module;
    this.applyModuleFilter();
  }

  private applyModuleFilter(): void {
    if (this.selectedModule === 'ALL') {
      this.filteredGroups = this.groups;
      return;
    }

    this.filteredGroups = this.groups.filter((group) => group.module === this.selectedModule);
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
    return !role.locked && this.accessControl.can('ROLE_PERMISSION_UPDATE');
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
