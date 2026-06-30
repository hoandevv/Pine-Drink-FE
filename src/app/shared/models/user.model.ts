export interface ScopeAccess {
  type: 'SYSTEM' | 'BRANCH' | string;
  branchIds: string[];
}

export interface AuthUser {
  id: string;
  username: string;
  fullName?: string | null;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  authProvider?: 'LOCAL' | 'GOOGLE' | string | null;
  hasLocalPassword?: boolean | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  scope?: ScopeAccess | null;
  roles?: string[];
  permissions?: string[];
  permissionsLoadedAt?: number;
}
