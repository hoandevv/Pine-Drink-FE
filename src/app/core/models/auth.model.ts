export interface PermissionCacheEntry {
  userId: string;
  permissions: string[];
  loadedAt: number;
}

export interface UpdateProfileRequest {
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface FileUploadResponseData {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}
