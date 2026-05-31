import { Component, OnInit } from '@angular/core';
import { AccountService, AccountListItemResponse, CreateAccountRequest, UpdateAccountRequest } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { finalize } from 'rxjs';
import { AccessControlService } from 'src/app/core/services/access-control.service';

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
  isLoading = false;
  isDrawerOpen = false;
  isEditDrawerOpen = false;
  isCreating = false;
  isUpdating = false;
  isUploadingAvatar = false;
  showCreatePassword = false;
  editingAccount: AccountRow | null = null;
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

  constructor(
    private accountService: AccountService,
    private authService: AuthService,
    public readonly accessControl: AccessControlService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.accountService.searchAccounts({
      keyword: this.searchTerm.trim() || undefined,
      roleCode: this.selectedRole === 'All' ? undefined : this.selectedRole,
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

  editAccount(account: AccountRow): void {
    this.editingAccount = account;
    this.updateForm = {
      fullName: account.fullName || account.displayName,
      email: account.email || '',
      phone: account.phone || '',
      avatarUrl: account.avatarUrl || ''
      // brandId reserved for future multi-brand assignment flow.
    };
    this.isEditDrawerOpen = true;
  }

  closeEditDrawer(): void {
    if (this.isUpdating) {
      return;
    }

    this.isEditDrawerOpen = false;
    this.editingAccount = null;
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
      // brandId reserved for future multi-brand assignment flow.
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
      fullName: this.createForm.fullName.trim(),
      email: this.createForm.email?.trim() || undefined,
      phone: this.createForm.phone?.trim() || undefined,
      status: 'ACTIVE',
      scopeType: 'SYSTEM'
    };

    if (!payload.username || !payload.password || !payload.fullName || !payload.roleCode) {
      window.alert('Vui lòng nhập đủ username, mật khẩu, họ tên và vai trò.');
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
      error: () => {
        window.alert('Không thể tạo tài khoản. Kiểm tra dữ liệu hoặc thử lại.');
      }
    });
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
      scopeType: 'SYSTEM'
    };
  }

  private getEmptyUpdateForm(): UpdateAccountRequest {
    return {
      fullName: '',
      email: '',
      phone: '',
      avatarUrl: ''
      // brandId reserved for future multi-brand assignment flow.
    };
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
