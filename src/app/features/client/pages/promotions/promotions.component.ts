import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { VoucherResponse, VoucherService } from '../../../vouchers/services/voucher.service';

type VoucherFilter = 'all' | 'shipping' | 'percentage' | 'expiring' | 'saved';

@Component({
  selector: 'app-promotions',
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.scss']
})
export class PromotionsComponent implements OnInit {
  allVouchers: VoucherResponse[] = [];
  filteredVouchers: VoucherResponse[] = [];
  selectedFilter: VoucherFilter = 'all';
  copiedVoucherId: string | null = null;
  savedVoucherIds = new Set<string>();
  loading = true;

  constructor(
    private readonly voucherService: VoucherService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.savedVoucherIds = new Set(JSON.parse(localStorage.getItem('pine_saved_vouchers') || '[]'));
    this.loadVouchers();
  }

  loadVouchers(): void {
    this.loading = true;
    const branchId = sessionStorage.getItem('selectedBranchId') || '';
    if (!branchId) {
      this.loading = false;
      this.allVouchers = [];
      this.filteredVouchers = [];
      this.toast.error('Vui lòng chọn chi nhánh để xem ưu đãi');
      return;
    }

    this.voucherService.getAvailableForCustomer({
      branchId,
      page: 0,
      size: 100,
      sort: 'createdAt,desc'
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: res => {
        this.allVouchers = res.data.content || [];
        this.applyFilter();
      },
      error: () => {
        this.allVouchers = [];
        this.filteredVouchers = [];
        this.toast.error('Không tải được ưu đãi');
      }
    });
  }

  filterVouchers(type: VoucherFilter): void {
    this.selectedFilter = type;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.selectedFilter === 'all') {
      this.filteredVouchers = [...this.allVouchers];
      return;
    }
    if (this.selectedFilter === 'saved') {
      this.filteredVouchers = this.allVouchers.filter(v => this.savedVoucherIds.has(v.id));
      return;
    }
    if (this.selectedFilter === 'expiring') {
      this.filteredVouchers = this.allVouchers.filter(v => this.isExpiringSoon(v));
      return;
    }
    if (this.selectedFilter === 'percentage') {
      this.filteredVouchers = this.allVouchers.filter(v => v.discountType === 'PERCENTAGE' || v.discountType === 'FIXED_AMOUNT');
      return;
    }
    if (this.selectedFilter === 'shipping') {
      this.filteredVouchers = this.allVouchers.filter(v => v.discountType === 'FREE_SHIPPING');
    }
  }

  saveVoucher(voucher: VoucherResponse): void {
    this.savedVoucherIds.add(voucher.id);
    localStorage.setItem('pine_saved_vouchers', JSON.stringify([...this.savedVoucherIds]));
    this.copyVoucherCode(voucher);
    this.applyFilter();
  }

  isSaved(voucher: VoucherResponse): boolean {
    return this.savedVoucherIds.has(voucher.id);
  }

  copyVoucherCode(voucher: VoucherResponse): void {
    navigator.clipboard.writeText(voucher.code).then(() => {
      this.copiedVoucherId = voucher.id;
      this.toast.success(`Đã copy mã ${voucher.code}`);
      setTimeout(() => this.copiedVoucherId = null, 2000);
    });
  }

  formatPrice(price?: number | null): string {
    return new Intl.NumberFormat('vi-VN').format(price || 0) + 'đ';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  getDiscountText(voucher: VoucherResponse): string {
    switch (voucher.discountType) {
      case 'PERCENTAGE': return `-${voucher.discountValue}%`;
      case 'FIXED_AMOUNT': return `-${this.formatPrice(voucher.discountValue)}`;
      case 'FREE_SHIPPING': return 'Freeship';
      default: return `-${this.formatPrice(voucher.discountValue)}`;
    }
  }

  getUsagePercentage(voucher: VoucherResponse): number {
    if (!voucher.usageLimit) return 0;
    return Math.min(100, (voucher.usedCount / voucher.usageLimit) * 100);
  }

  remainingCount(voucher: VoucherResponse): number {
    if (!voucher.usageLimit) return 999;
    return Math.max(0, voucher.usageLimit - voucher.usedCount);
  }

  isExpiringSoon(voucher: VoucherResponse): boolean {
    const endDate = new Date(voucher.endAt);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }
}
