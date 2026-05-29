import { Component } from '@angular/core';

interface AccountSummary {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';
  status: 'Online' | 'Active' | 'Locked' | 'Pending';
  lastLogin: string;
  permissions: number;
}

@Component({
  selector: 'app-accounts-page',
  templateUrl: './accounts-page.component.html',
  styleUrls: ['./accounts-page.component.scss']
})
export class AccountsPageComponent {
  searchTerm = '';
  selectedRole = 'All';

  readonly roles = ['All', 'SUPER_ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'];

  readonly accounts: AccountSummary[] = [
    { id: 'ACC-001', name: 'Hoan Admin', role: 'SUPER_ADMIN', email: 'hoan@pinedrink.vn', status: 'Online', lastLogin: 'Đang hoạt động', permissions: 18 },
    { id: 'ACC-002', name: 'Mai Store', role: 'MANAGER', email: 'mai.manager@pinedrink.vn', status: 'Active', lastLogin: '15 phút trước', permissions: 12 },
    { id: 'ACC-003', name: 'Khoa Staff', role: 'STAFF', email: 'khoa.staff@pinedrink.vn', status: 'Active', lastLogin: '1 giờ trước', permissions: 7 },
    { id: 'ACC-004', name: 'Vy Customer', role: 'CUSTOMER', email: 'vy.customer@email.vn', status: 'Pending', lastLogin: 'Chưa xác minh', permissions: 3 }
  ];

  get filteredAccounts(): AccountSummary[] {
    const keyword = this.searchTerm.trim().toLowerCase();
    return this.accounts.filter((account) => {
      const matchesRole = this.selectedRole === 'All' || account.role === this.selectedRole;
      const matchesKeyword = !keyword || [account.name, account.email, account.id, account.role]
        .some((value) => value.toLowerCase().includes(keyword));
      return matchesRole && matchesKeyword;
    });
  }

  get adminCount(): number {
    return this.accounts.filter((account) => ['SUPER_ADMIN', 'MANAGER'].includes(account.role)).length;
  }

  get lockedCount(): number {
    return this.accounts.filter((account) => account.status === 'Locked').length;
  }

  get pendingCount(): number {
    return this.accounts.filter((account) => account.status === 'Pending').length;
  }
}
