import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BaseResponse } from '../../../shared/models/base-response.model';

export interface PermissionDefinition {
  code: string;
  name: string;
  description: string;
  module: string;
  status?: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RolePermissionMatrix {
  role: string;
  label: string;
  description: string;
  roleType?: string;
  status?: string;
  locked?: boolean;
  permissions: string[];
}

interface PermissionApiResponse {
  code: string;
  name: string;
  module: string;
  description: string;
  status: string;
}

interface RoleApiResponse {
  code: string;
  name: string;
  description: string;
  roleType: string;
  status: string;
  editable: boolean;
}

interface RolePermissionsMatrixApiResponse {
  roles: RoleApiResponse[];
  permissions: PermissionApiResponse[];
  matrix: Record<string, string[]>;
}

@Injectable()
export class PermissionService {
  private readonly apiUrl = `${environment.apiBaseUrl}/authorization`;
  private readonly highRiskPermissions = new Set([
    'ACCOUNT_CHANGE_STATUS',
    'ACCOUNT_RESET_PASSWORD',
    'ACCOUNT_ROLE_ASSIGN',
    'ACCOUNT_ROLE_REVOKE',
    'ROLE_PERMISSION_UPDATE',
    'BRANCH_DELETE'
  ]);
  private readonly mediumRiskKeywords = ['CREATE', 'UPDATE', 'DELETE', 'UPLOAD', 'ASSIGN', 'REVOKE'];

  constructor(private readonly http: HttpClient) {}

  getPermissions(): Observable<PermissionDefinition[]> {
    return this.http
      .get<BaseResponse<PermissionApiResponse[]>>(`${this.apiUrl}/permissions`)
      .pipe(map((response) => response.data.map((permission) => this.mapPermission(permission))));
  }

  getRolePermissionMatrix(): Observable<RolePermissionMatrix[]> {
    return this.http
      .get<BaseResponse<RolePermissionsMatrixApiResponse>>(`${this.apiUrl}/role-permissions/matrix`)
      .pipe(map((response) => this.mapMatrix(response.data)));
  }

  saveRolePermissions(role: string, permissions: string[]): Observable<RolePermissionMatrix> {
    return this.http
      .put<BaseResponse<RolePermissionsMatrixApiResponse>>(`${this.apiUrl}/roles/${role}/permissions`, { permissions })
      .pipe(
        map((response) => this.mapMatrix(response.data).find((item) => item.role === role)),
        map((updatedRole) => {
          if (!updatedRole) {
            throw new Error('Không tìm thấy role sau khi cập nhật.');
          }
          return updatedRole;
        })
      );
  }

  private mapMatrix(data: RolePermissionsMatrixApiResponse): RolePermissionMatrix[] {
    return data.roles.map((role) => ({
      role: role.code,
      label: role.name || role.code,
      description: role.description || 'Chưa có mô tả.',
      roleType: role.roleType,
      status: role.status,
      locked: !role.editable,
      permissions: data.matrix?.[role.code] ?? []
    }));
  }

  private mapPermission(permission: PermissionApiResponse): PermissionDefinition {
    return {
      code: permission.code,
      name: permission.name || permission.code,
      description: permission.description || 'Chưa có mô tả.',
      module: permission.module || 'General',
      status: permission.status,
      risk: this.resolveRisk(permission.code)
    };
  }

  private resolveRisk(code: string): PermissionDefinition['risk'] {
    const normalizedCode = code.toUpperCase().replace(/^PERM_/, '');
    if (this.highRiskPermissions.has(normalizedCode)) {
      return 'HIGH';
    }

    return this.mediumRiskKeywords.some((keyword) => normalizedCode.includes(keyword)) ? 'MEDIUM' : 'LOW';
  }
}
