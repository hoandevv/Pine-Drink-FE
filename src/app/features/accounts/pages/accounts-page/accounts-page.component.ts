import { Component, OnInit } from '@angular/core';
import { AccountService, AccountListItemResponse, CreateAccountRequest, UpdateAccountRequest, AccountDetailResponse, AccountRoleAssignmentResponse } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { finalize } from 'rxjs';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { BranchService } from 'src/app/features/branches/services/branch.service';
import { Branch } from 'src/app/features/branches/models/branch.model';

interface AccountRow extends AccountListItemResponse {
  displayName: string;
  displayEmail: string;
  displayRole: string;
  roleClass: string;
  statusLabel: string;
  statusClass: string;
  icon: string;
}

@Component({
  selector: 'app-accounts-page',
  templateUrl: './accounts-page.component.html',
  styleUrls: ['./accounts-page.component.scss']
})
export class AccountsPageComponent implements OnInit {
  searchTerm = '';
  selectedRole = 'All';
  selectedBranchId = 'All';
  isLoading = false;
  isDrawerOpen = false;
  isEditDrawerOpen = false;
  isDetailDrawerOpen = false;
  isCreating = false;
  isUpdating = false;
  isLoadingDetail = false;
  isUploadingAvatar = false;
  showCreatePassword = false;
  editingAccount: AccountRow | null = null;
  selectedAccountDetail: AccountDetailResponse | null = null;
  accounts: AccountRow[] = [];
  adminCount = 0;
  lockedCount = 0;
  pendingCount = 0;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  pageSizeOptions = [5, 10, 20, 50];

  createForm: CreateAccountRequest = this.getEmptyForm();
  updateForm: UpdateAccountRequest = this.getEmptyUpdateForm();
  readonly internalRoles = ['ADMIN', 'MANAGER', 'DELIVERY'];
  readonly roles = ['All', ...this.internalRoles];
  availableBranches: Branch[] = [];
  isLoadingBranches = false;

  constructor(
    private accountService: AccountService,
    private authService: AuthService,
    public readonly accessControl: AccessControlService,
    private readonly branchService: BranchService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
    this.loadBranchesForScope();
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.accountService.searchAccounts({
      keyword: this.searchTerm.trim() || undefined,
      roleCode: this.selectedRole === 'All' ? undefined : this.selectedRole,
      branchId: this.selectedBranchId === 'All' ? undefined : this.selectedBranchId,
      page: this.currentPage,
      size: this.pageSize
    }).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (res) => {
        const content = res.data?.content || [];
        this.accounts = content
          .filter((account) => this.internalRoles.includes(this.getPrimaryRole(account)))
          .map((account) => this.toAccountRow(account));
        this.adminCount = this.accounts.filter((a) => ['ADMIN', 'MANAGER'].includes(a.displayRole)).length;
        this.lockedCount = this.accounts.filter((a) => a.statusClass === 'locked').length;
        this.pendingCount = this.accounts.filter((a) => a.statusClass === 'pending').length;
        this.totalElements = res.data?.totalElements || this.accounts.length;
        this.totalPages = res.data?.totalPages || 0;
      },
      error: () => {
        this.accounts = [];
        this.adminCount = 0;
        this.lockedCount = 0;
        this.pendingCount = 0;
        this.totalElements = 0;
        this.totalPages = 0;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadAccounts();
  }

  filterByRole(role: string): void {
    this.selectedRole = role;
    this.currentPage = 0;
    this.loadAccounts();
  }

  filterByBranch(branchId: string): void {
    this.selectedBranchId = branchId;
    this.currentPage = 0;
    this.loadAccounts();
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadAccounts();
  }

  changePageSize(size: string): void {
    this.pageSize = Number(size);
    this.currentPage = 0;
    this.loadAccounts();
  }

  openCreateDrawer(): void {
    if (!this.accessControl.can('ACCOUNT_CREATE')) {
      return;
    }

    this.createForm = this.getEmptyForm();
    this.applyRoleScopeDefaults();
    this.showCreatePassword = false;
    this.isDrawerOpen = true;
  }

  closeCreateDrawer(): void {
    if (this.isCreating) {
      return;
    }

    this.isDrawerOpen = false;
  }

  toggleCreatePassword(): void {
    this.showCreatePassword = !this.showCreatePassword;
  }

  viewAccount(account: AccountRow): void {
    this.isDetailDrawerOpen = true;
    this.loadAccountDetail(account.id);
  }

  closeDetailDrawer(): void {
    if (this.isLoadingDetail) {
      return;
    }

    this.isDetailDrawerOpen = false;
    this.selectedAccountDetail = null;
  }

  editAccount(account: AccountRow): void {
    this.editingAccount = account;
    this.isEditDrawerOpen = true;
    this.loadAccountDetail(account.id, true);
  }

  closeEditDrawer(): void {
    if (this.isUpdating) {
      return;
    }

    this.isEditDrawerOpen = false;
    this.editingAccount = null;
    this.selectedAccountDetail = null;
  }

  updateAccount(): void {
    if (!this.editingAccount) {
      return;
    }

    const payload: UpdateAccountRequest = {
      fullName: this.updateForm.fullName?.trim() || undefined,
      email: this.updateForm.email?.trim() || undefined,
      phone: this.updateForm.phone?.trim() || undefined,
      avatarUrl: this.updateForm.avatarUrl?.trim() || undefined
    };

    this.isUpdating = true;
    this.accountService.updateAccount(this.editingAccount.id, payload).pipe(
      finalize(() => {
        this.isUpdating = false;
      })
    ).subscribe({
      next: () => {
        window.alert('Đã cập nhật tài khoản.');
        this.closeEditDrawer();
        this.loadAccounts();
      },
      error: () => {
        window.alert('Không thể cập nhật tài khoản. Vui lòng kiểm tra dữ liệu.');
      }
    });
  }

  onEditAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      window.alert('Vui lòng chọn file ảnh.');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert('Ảnh không được vượt quá 5MB.');
      input.value = '';
      return;
    }

    this.isUploadingAvatar = true;
    this.authService.uploadAvatar(file).pipe(
      finalize(() => {
        this.isUploadingAvatar = false;
        input.value = '';
      })
    ).subscribe({
      next: (response) => {
        this.updateForm.avatarUrl = response.fileUrl;
      },
      error: () => {
        window.alert('Không thể upload avatar. Vui lòng thử lại.');
      }
    });
  }

  toggleAccountLock(account: AccountRow): void {
    const isUnlocking = account.statusClass === 'locked';
    const nextStatus = isUnlocking ? 'ACTIVE' : 'LOCKED';
    const actionLabel = isUnlocking ? 'mở khóa' : 'khóa';
    const confirmed = window.confirm(
      `Bạn có chắc muốn ${actionLabel} tài khoản "${account.displayName}" không?`
    );

    if (!confirmed) {
      return;
    }

    this.accountService.updateAccountStatus(account.id, nextStatus).subscribe({
      next: () => {
        window.alert(`Đã ${actionLabel} tài khoản "${account.displayName}".`);
        this.loadAccounts();
      },
      error: () => {
        window.alert(`Không thể ${actionLabel} tài khoản. Vui lòng thử lại.`);
      }
    });
  }

  createAccount(): void {
    const payload: CreateAccountRequest = {
      ...this.createForm,
      username: this.createForm.username.trim(),
      password: this.createForm.password.trim(),
      fullName: this.createForm.fullName.trim(),
      email: this.createForm.email?.trim() || undefined,
      phone: this.createForm.phone?.trim() || undefined,
      status: 'ACTIVE',
      scopeType: this.createForm.scopeType || 'BRANCH',
      scopeBranchId: this.createForm.scopeBranchId?.trim() || undefined
    };

    const validationMessage = this.getCreateValidationMessage(payload);
    if (validationMessage) {
      window.alert(validationMessage);
      return;
    }

    this.isCreating = true;
    this.accountService.createAccount(payload).pipe(
      finalize(() => {
        this.isCreating = false;
      })
    ).subscribe({
      next: () => {
        window.alert('Đã tạo tài khoản nội bộ.');
        this.isDrawerOpen = false;
        this.loadAccounts();
      },
      error: (error) => {
        window.alert(this.getAccountErrorMessage(error, 'Không thể tạo tài khoản. Kiểm tra dữ liệu hoặc thử lại.'));
      }
    });
  }

  private getCreateValidationMessage(payload: CreateAccountRequest): string | null {
    if (!payload.username || !payload.password || !payload.fullName || !payload.roleCode) {
      return 'Vui lòng nhập đủ username, mật khẩu, họ tên và vai trò.';
    }

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return 'Email chưa đúng định dạng.';
    }

    if (payload.password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    if (!/[A-Z]/.test(payload.password) || !/[a-z]/.test(payload.password) || !/\d/.test(payload.password)) {
      return 'Mật khẩu cần có chữ hoa, chữ thường và số.';
    }

    if (payload.phone && !/^(0|\+84)\d{9,10}$/.test(payload.phone)) {
      return 'Số điện thoại chưa đúng định dạng.';
    }

    if (payload.scopeType === 'BRANCH' && !payload.scopeBranchId) {
      return 'Vui lòng chọn chi nhánh cho Manager/Delivery.';
    }

    return null;
  }

  private getAccountErrorMessage(error: { errorCode?: string; message?: string; fieldErrors?: { field: string; message: string }[] }, fallback: string): string {
    const errorMessages: Record<string, string> = {
      AUTH_010: 'Mật khẩu chưa đủ mạnh. Vui lòng dùng ít nhất 8 ký tự gồm chữ hoa, chữ thường và số.',
      AUTH_013: 'Tên đăng nhập này đã được sử dụng.',
      AUTH_014: 'Email này đã được sử dụng.',
      AUTH_015: 'Số điện thoại này đã được sử dụng.',
      AUTH_021: 'Tài khoản chưa được gán vào chi nhánh phù hợp.'
    };

    if (error?.fieldErrors?.length) {
      return error.fieldErrors.map((fieldError) => `${fieldError.field}: ${fieldError.message}`).join('\n');
    }

    if (error?.errorCode && errorMessages[error.errorCode]) {
      return errorMessages[error.errorCode];
    }

    return error?.message || fallback;
  }

  private getEmptyForm(): CreateAccountRequest {
    return {
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      roleCode: 'DELIVERY',
      status: 'ACTIVE',
      scopeType: 'BRANCH',
      scopeBranchId: ''
    };
  }

  onCreateRoleChange(roleCode: string): void {
    this.createForm.roleCode = roleCode;
    this.applyRoleScopeDefaults();
  }

  private applyRoleScopeDefaults(): void {
    if (this.createForm.roleCode === 'ADMIN') {
      this.createForm.scopeType = 'SYSTEM';
      this.createForm.scopeBranchId = undefined;
      return;
    }

    this.createForm.scopeType = 'BRANCH';
    if (!this.createForm.scopeBranchId && this.availableBranches.length === 1) {
      this.createForm.scopeBranchId = this.availableBranches[0].id;
    }
  }

  private loadBranchesForScope(): void {
    this.isLoadingBranches = true;
    this.branchService.getActiveBranches(0, 200).pipe(
      finalize(() => {
        this.isLoadingBranches = false;
      })
    ).subscribe({
      next: (page) => {
        const branches = page.content || [];
        this.availableBranches = this.filterBranchesByCurrentScope(branches);
        this.applyRoleScopeDefaults();
      },
      error: () => {
        this.availableBranches = [];
      }
    });
  }

  private filterBranchesByCurrentScope(branches: Branch[]): Branch[] {
    const scope = this.authService.getCurrentUser()?.scope;
    if (!scope || scope.type === 'SYSTEM') {
      return branches;
    }

    const allowedIds = new Set(scope.branchIds || []);
    return branches.filter((branch) => allowedIds.has(branch.id));
  }

  private getEmptyUpdateForm(): UpdateAccountRequest {
    return {
      fullName: '',
      email: '',
      phone: '',
      avatarUrl: ''
    };
  }

  private loadAccountDetail(accountId: string, forEdit = false): void {
    this.isLoadingDetail = true;
    this.accountService.getAccountDetail(accountId).pipe(
      finalize(() => {
        this.isLoadingDetail = false;
      })
    ).subscribe({
      next: (res) => {
        const detail = res.data;
        if (!detail) {
          return;
        }

        this.selectedAccountDetail = detail;
        if (forEdit) {
          this.patchUpdateForm(detail);
        }
      },
      error: () => {
        window.alert('Không thể tải đầy đủ thông tin tài khoản.');
      }
    });
  }

  private patchUpdateForm(detail: AccountDetailResponse): void {
    this.updateForm = {
      fullName: detail.fullName || '',
      email: detail.email || '',
      phone: detail.phone || '',
      avatarUrl: detail.avatarUrl || ''
    };
  }

  getDetailPrimaryRole(): AccountRoleAssignmentResponse | null {
    return this.selectedAccountDetail?.roleAssignments?.[0] || null;
  }

  getRoleAssignments(detail: AccountDetailResponse | null): AccountRoleAssignmentResponse[] {
    return detail?.roleAssignments || [];
  }

  getBranchName(branchId?: string | null): string {
    if (!branchId) {
      return 'Toàn hệ thống';
    }

    return this.availableBranches.find((branch) => branch.id === branchId)?.name || branchId;
  }

  formatDateTime(value?: string | null): string {
    if (!value) {
      return 'Chưa có';
    }

    return new Date(value).toLocaleString('vi-VN');
  }

  private getPrimaryRole(account: AccountListItemResponse): string {
    return account.roleCode || account.roles?.[0] || 'UNKNOWN';
  }

  private toAccountRow(account: AccountListItemResponse): AccountRow {
    const role = this.getPrimaryRole(account);
    const status = account.status || 'UNKNOWN';

    return {
      ...account,
      displayName: account.fullName || account.username || 'Tài khoản chưa đặt tên',
      displayEmail: account.email || 'Chưa có email',
      displayRole: role,
      roleClass: role.toLowerCase(),
      statusLabel: status,
      statusClass: status.toLowerCase(),
      icon: role === 'DELIVERY' ? 'local_shipping' : 'admin_panel_settings'
    };
  }
}
