import { Component, OnInit } from '@angular/core';
import { AccountService, AccountListItemResponse } from 'src/app/core/services/account.service';
import { finalize } from 'rxjs';

interface CustomerRow extends AccountListItemResponse {
  displayName: string;
  initials: string;
  displayEmail: string;
  customerCode: string;
  formattedLastLogin: string;
  statusLabel: string;
  statusClass: string;
}

@Component({
  selector: 'app-customers-page',
  templateUrl: './customers-page.component.html',
  styleUrls: ['./customers-page.component.scss']
})
export class CustomersPageComponent implements OnInit {
  searchTerm = '';
  selectedStatus = 'All';
  isLoading = false;
  customers: CustomerRow[] = [];

  activeCount = 0;
  lockedCount = 0;
  pendingCount = 0;
  recentLoginCount = 0;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  pageSizeOptions = [5, 10, 20, 50];

  readonly statuses = ['All', 'ACTIVE', 'PENDING', 'LOCKED', 'INACTIVE'];

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.accountService.searchAccounts({
      keyword: this.searchTerm.trim() || undefined,
      status: this.selectedStatus === 'All' ? undefined : this.selectedStatus,
      roleCode: 'CUSTOMER',
      page: this.currentPage,
      size: this.pageSize
    }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (res) => {
        const content = res.data?.content || [];
        this.customers = content.map(c => this.toCustomerRow(c));
        this.totalElements = res.data?.totalElements || this.customers.length;
        this.totalPages = res.data?.totalPages || 0;
        this.calculateStats();
      },
      error: () => {
        this.customers = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.calculateStats();
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadCustomers();
  }

  refresh(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.currentPage = 0;
    this.loadCustomers();
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 0;
    this.loadCustomers();
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadCustomers();
  }

  changePageSize(size: string): void {
    this.pageSize = Number(size);
    this.currentPage = 0;
    this.loadCustomers();
  }

  toggleCustomerLock(customer: CustomerRow): void {
    const isUnlocking = customer.status === 'LOCKED';
    const nextStatus = isUnlocking ? 'ACTIVE' : 'LOCKED';
    const actionLabel = isUnlocking ? 'mở khóa' : 'khóa';
    const confirmed = window.confirm(
      `Bạn có chắc muốn ${actionLabel} tài khoản "${customer.displayName}" không?`
    );

    if (!confirmed) {
      return;
    }

    this.accountService.updateAccountStatus(customer.id, nextStatus).subscribe({
      next: () => {
        window.alert(`Đã ${actionLabel} tài khoản "${customer.displayName}".`);
        this.loadCustomers();
      },
      error: () => {
        window.alert(`Không thể ${actionLabel} tài khoản. Vui lòng thử lại.`);
      }
    });
  }

  calculateStats(): void {
    this.activeCount = this.customers.filter((c) => c.status === 'ACTIVE').length;
    this.lockedCount = this.customers.filter((c) => c.status === 'LOCKED').length;
    this.pendingCount = this.customers.filter((c) => c.status === 'PENDING').length;
    this.recentLoginCount = this.customers.filter((c) => !!c.lastLoginAt).length;
  }

  private toCustomerRow(customer: AccountListItemResponse): CustomerRow {
    const displayName = customer.fullName || customer.username || 'Khách hàng chưa đặt tên';
    const status = customer.status || 'UNKNOWN';
    
    let initials = 'KH';
    if (displayName) {
      initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
    }
    
    let formattedLastLogin = 'Chưa đăng nhập';
    if (customer.lastLoginAt) {
      try {
        formattedLastLogin = new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(customer.lastLoginAt));
      } catch (e) {
        formattedLastLogin = 'Ngày không hợp lệ';
      }
    }

    const labels: Record<string, string> = {
      ACTIVE: 'Đang hoạt động',
      LOCKED: 'Bị khóa',
      PENDING: 'Chờ xác minh',
      INACTIVE: 'Ngưng hoạt động'
    };

    return {
      ...customer,
      displayName,
      initials: initials || 'KH',
      displayEmail: customer.email || 'Chưa có email',
      customerCode: customer.id ? `#${customer.id.slice(0, 8).toUpperCase()}` : '#N/A',
      formattedLastLogin,
      statusLabel: labels[status] || status || 'Chưa rõ',
      statusClass: status.toLowerCase()
    };
  }
}
