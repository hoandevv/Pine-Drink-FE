import { Component, OnInit } from '@angular/core';
import { MOCK_VOUCHERS, MockVoucher } from '../../../../shared/mock-data';

@Component({
  selector: 'app-promotions',
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.scss']
})
export class PromotionsComponent implements OnInit {
  allVouchers: MockVoucher[] = [];
  filteredVouchers: MockVoucher[] = [];
  selectedFilter: 'all' | 'percentage' | 'fixed' | 'shipping' = 'all';
  copiedVoucherId: string | null = null;

  constructor() {}

  ngOnInit(): void {
    this.loadVouchers();
  }

  loadVouchers(): void {
    this.allVouchers = MOCK_VOUCHERS.filter(v => v.isActive);
    this.filteredVouchers = [...this.allVouchers];
  }

  filterVouchers(type: 'all' | 'percentage' | 'fixed' | 'shipping'): void {
    this.selectedFilter = type;
    
    if (type === 'all') {
      this.filteredVouchers = [...this.allVouchers];
    } else {
      const typeMap = {
        'percentage': 'PERCENTAGE',
        'fixed': 'FIXED_AMOUNT',
        'shipping': 'FREE_SHIPPING'
      };
      this.filteredVouchers = this.allVouchers.filter(v => v.discountType === typeMap[type]);
    }
  }

  copyVoucherCode(voucher: MockVoucher): void {
    navigator.clipboard.writeText(voucher.code).then(() => {
      this.copiedVoucherId = voucher.id;
      setTimeout(() => {
        this.copiedVoucherId = null;
      }, 2000);
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getDiscountText(voucher: MockVoucher): string {
    switch (voucher.discountType) {
      case 'PERCENTAGE':
        return `Giảm ${voucher.discountValue}%`;
      case 'FIXED_AMOUNT':
        return `Giảm ${this.formatPrice(voucher.discountValue)}`;
      case 'FREE_SHIPPING':
        return 'Miễn phí ship';
      default:
        return '';
    }
  }

  getUsagePercentage(voucher: MockVoucher): number {
    return (voucher.usedCount / voucher.usageLimit) * 100;
  }

  isExpiringSoon(voucher: MockVoucher): boolean {
    const endDate = new Date(voucher.endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }
}
