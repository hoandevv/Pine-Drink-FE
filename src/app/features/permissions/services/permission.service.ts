import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import {
  PermissionApiResponse,
  PermissionDefinition,
  RolePermissionMatrix,
  RolePermissionsMatrixApiResponse
} from '../models/permission.model';

@Injectable()
export class PermissionService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.authorization.base}`;
  private readonly highRiskPermissions = new Set([
    'ACCOUNT_CHANGE_STATUS',
    'ACCOUNT_RESET_PASSWORD',
    'ACCOUNT_ROLE_ASSIGN',
    'ACCOUNT_ROLE_REVOKE',
    'ROLE_PERMISSION_UPDATE',
    'BRANCH_DELETE'
  ]);
  private readonly mediumRiskKeywords = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'UPLOAD',
    'ASSIGN',
    'REVOKE'
  ];

  constructor(private readonly http: HttpClient) {}

  getPermissions(): Observable<PermissionDefinition[]> {
    const url = `${this.apiUrl}/permissions`;

    return this.http
      .get<BaseResponse<PermissionApiResponse[]>>(url)
      .pipe(map((response) => response.data.map((permission) => this.mapPermission(permission))));
  }

  getRolePermissionMatrix(): Observable<RolePermissionMatrix[]> {
    const url = `${this.apiUrl}/role-permissions/matrix`;

    return this.http
      .get<BaseResponse<RolePermissionsMatrixApiResponse>>(url)
      .pipe(map((response) => this.mapMatrix(response.data)));
  }

  saveRolePermissions(role: string, permissions: string[]): Observable<RolePermissionMatrix> {
    const url = `${this.apiUrl}/roles/${role}/permissions`;
    const body = { permissions };

    return this.http
      .put<BaseResponse<RolePermissionsMatrixApiResponse>>(url, body)
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

    const hasMediumRiskKeyword = this.mediumRiskKeywords.some((keyword) => {
      return normalizedCode.includes(keyword);
    });

    if (hasMediumRiskKeyword) {
      return 'MEDIUM';
    }

    return 'LOW';
  }
}
