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

export interface PermissionApiResponse {
  code: string;
  name: string;
  module: string;
  description: string;
  status: string;
}

export interface RoleApiResponse {
  code: string;
  name: string;
  description: string;
  roleType: string;
  status: string;
  editable: boolean;
}

export interface RolePermissionsMatrixApiResponse {
  roles: RoleApiResponse[];
  permissions: PermissionApiResponse[];
  matrix: Record<string, string[]>;
}