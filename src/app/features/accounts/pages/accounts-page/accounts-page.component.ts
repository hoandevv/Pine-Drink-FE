import { Component, OnInit } from '@angular/core';
import { AccountService, AccountListItemResponse, CreateAccountRequest } from 'src/app/core/services/account.service';
import { finalize } from 'rxjs';

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
  isCreating = false;
  showCreatePassword = false;
  accounts: AccountRow[] = [];
  adminCount = 0;
  lockedCount = 0;
  pendingCount = 0;

  createForm: CreateAccountRequest = this.getEmptyForm();
  readonly internalRoles = ['ADMIN', 'MANAGER', 'STAFF'];
  readonly roles = ['All', ...this.internalRoles];

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.accountService.searchAccounts({
      keyword: this.searchTerm.trim() || undefined,
      roleCode: this.selectedRole === 'All' ? undefined : this.selectedRole,
      page: 0,
      size: 50
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
      },
      error: () => {
        this.accounts = [];
        this.adminCount = 0;
        this.lockedCount = 0;
        this.pendingCount = 0;
      }
    });
  }

  onSearch(): void {
    this.loadAccounts();
  }

  filterByRole(role: string): void {
    this.selectedRole = role;
    this.loadAccounts();
  }

  openCreateDrawer(): void {
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
    window.alert(`Chức năng sửa tài khoản "${account.displayName}" sẽ được bổ sung sau.`);
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
      roleCode: 'STAFF',
      status: 'ACTIVE',
      scopeType: 'SYSTEM'
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
      icon: role === 'STAFF' ? 'support_agent' : 'admin_panel_settings'
    };
  }
}
