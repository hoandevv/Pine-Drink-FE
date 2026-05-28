export interface AuthUser {
  id: string;
  brandId?: string | null;
  username: string;
  fullName?: string | null;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  lastLoginAt?: string | null;
  roles?: string[];
}
