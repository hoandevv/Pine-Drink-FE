import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface PermissionDefinition {
  code: string;
  name: string;
  description: string;
  module: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RolePermissionMatrix {
  role: string;
  label: string;
  description: string;
  locked?: boolean;
  permissions: string[];
}

@Injectable()
export class PermissionService {
  private readonly permissions: PermissionDefinition[] = [
    { code: 'ACCOUNT_VIEW', name: 'Xem tài khoản', description: 'Xem danh sách và chi tiết tài khoản.', module: 'Account', risk: 'LOW' },
    { code: 'ACCOUNT_CREATE', name: 'Tạo tài khoản', description: 'Tạo tài khoản nội bộ mới.', module: 'Account', risk: 'MEDIUM' },
    { code: 'ACCOUNT_UPDATE', name: 'Cập nhật tài khoản', description: 'Sửa thông tin tài khoản.', module: 'Account', risk: 'MEDIUM' },
    { code: 'ACCOUNT_CHANGE_STATUS', name: 'Đổi trạng thái', description: 'Khóa, mở khóa hoặc vô hiệu hóa tài khoản.', module: 'Account', risk: 'HIGH' },
    { code: 'ACCOUNT_RESET_PASSWORD', name: 'Đặt lại mật khẩu', description: 'Reset mật khẩu cho người dùng.', module: 'Account', risk: 'HIGH' },
    { code: 'ACCOUNT_ROLE_VIEW', name: 'Xem phân quyền', description: 'Xem vai trò và permission.', module: 'Account', risk: 'LOW' },
    { code: 'ACCOUNT_ROLE_ASSIGN', name: 'Gán vai trò', description: 'Gán role hoặc permission cho tài khoản.', module: 'Account', risk: 'HIGH' },
    { code: 'ACCOUNT_ROLE_REVOKE', name: 'Gỡ vai trò', description: 'Thu hồi role hoặc permission.', module: 'Account', risk: 'HIGH' },
    { code: 'BRANCH_VIEW', name: 'Xem chi nhánh', description: 'Xem danh sách chi nhánh.', module: 'Branch', risk: 'LOW' },
    { code: 'BRANCH_CREATE', name: 'Tạo chi nhánh', description: 'Tạo chi nhánh mới.', module: 'Branch', risk: 'MEDIUM' },
    { code: 'BRANCH_UPDATE', name: 'Cập nhật chi nhánh', description: 'Sửa thông tin và vận hành chi nhánh.', module: 'Branch', risk: 'MEDIUM' },
    { code: 'BRANCH_DELETE', name: 'Đóng/Xóa chi nhánh', description: 'Tạm ngưng, đóng hoặc xóa chi nhánh.', module: 'Branch', risk: 'HIGH' },
    { code: 'PROFILE_VIEW', name: 'Xem hồ sơ', description: 'Xem hồ sơ cá nhân.', module: 'Profile', risk: 'LOW' },
    { code: 'PROFILE_UPDATE', name: 'Cập nhật hồ sơ', description: 'Sửa hồ sơ cá nhân.', module: 'Profile', risk: 'LOW' },
    { code: 'CUSTOMER_ADDRESS_VIEW', name: 'Xem địa chỉ', description: 'Xem địa chỉ khách hàng.', module: 'Customer Address', risk: 'LOW' },
    { code: 'CUSTOMER_ADDRESS_CREATE', name: 'Tạo địa chỉ', description: 'Thêm địa chỉ giao hàng.', module: 'Customer Address', risk: 'LOW' },
    { code: 'CUSTOMER_ADDRESS_UPDATE', name: 'Sửa địa chỉ', description: 'Cập nhật địa chỉ giao hàng.', module: 'Customer Address', risk: 'LOW' },
    { code: 'CUSTOMER_ADDRESS_DELETE', name: 'Xóa địa chỉ', description: 'Xóa địa chỉ giao hàng.', module: 'Customer Address', risk: 'MEDIUM' },
    { code: 'FILE_UPLOAD', name: 'Tải file', description: 'Upload avatar hoặc tài nguyên.', module: 'File', risk: 'MEDIUM' },
    { code: 'GEOCODING_VIEW', name: 'Tra cứu bản đồ', description: 'Tìm kiếm và reverse geocoding.', module: 'Map', risk: 'LOW' }
  ];

  private readonly matrix: RolePermissionMatrix[] = [
    {
      role: 'ADMIN',
      label: 'Admin',
      description: 'Toàn quyền quản trị hệ thống.',
      locked: true,
      permissions: this.permissions.map((permission) => permission.code)
    },
    {
      role: 'MANAGER',
      label: 'Quản lý',
      description: 'Quản lý vận hành, không được đóng/xóa chi nhánh hoặc chỉnh quyền nguy hiểm.',
      permissions: [
        'ACCOUNT_VIEW',
        'ACCOUNT_ROLE_VIEW',
        'BRANCH_VIEW',
        'BRANCH_CREATE',
        'BRANCH_UPDATE',
        'PROFILE_VIEW',
        'PROFILE_UPDATE',
        'FILE_UPLOAD',
        'GEOCODING_VIEW'
      ]
    },
    {
      role: 'DELIVERY',
      label: 'Giao hàng',
      description: 'Truy cập hồ sơ, bản đồ và nghiệp vụ giao hàng.',
      permissions: ['PROFILE_VIEW', 'PROFILE_UPDATE', 'FILE_UPLOAD', 'GEOCODING_VIEW']
    },
    {
      role: 'CUSTOMER',
      label: 'Khách hàng',
      description: 'Quyền tự quản lý hồ sơ và địa chỉ.',
      permissions: [
        'PROFILE_VIEW',
        'PROFILE_UPDATE',
        'CUSTOMER_ADDRESS_VIEW',
        'CUSTOMER_ADDRESS_CREATE',
        'CUSTOMER_ADDRESS_UPDATE',
        'CUSTOMER_ADDRESS_DELETE',
        'FILE_UPLOAD',
        'GEOCODING_VIEW'
      ]
    }
  ];

  getPermissions(): Observable<PermissionDefinition[]> {
    return of(this.permissions);
  }

  getRolePermissionMatrix(): Observable<RolePermissionMatrix[]> {
    return of(this.matrix.map((role) => ({ ...role, permissions: [...role.permissions] })));
  }

  saveRolePermissions(role: string, permissions: string[]): Observable<RolePermissionMatrix> {
    const target = this.matrix.find((item) => item.role === role);
    if (!target || target.locked) {
      throw new Error('Role không được phép cập nhật.');
    }

    target.permissions = [...permissions];
    return of({ ...target, permissions: [...target.permissions] });
  }
}
