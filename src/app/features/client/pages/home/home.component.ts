import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';
import { Branch } from '../../../branches/models/branch.model';
import { BranchHours } from '../../../branches/models/branch-hours.model';
import { BranchService } from '../../../branches/services/branch.service';
import { MOCK_VOUCHERS, MockVoucher } from '../../../../shared/mock-data';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  bestSellerProducts: Product[] = [];
  vouchers: MockVoucher[] = [];
  nearbyBranches: Branch[] = [];
  selectedBranch: Branch | null = null;
  loadingProducts = false;
  productError = '';
  branchError = '';
  branchHoursByBranchId: Record<string, BranchHours[]> = {};

  constructor(
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly branchService: BranchService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadProducts();
    this.loadBranches();

    this.vouchers = MOCK_VOUCHERS
      .filter(voucher => voucher.isActive)
      .slice(0, 3);
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productError = '';
    this.productService.getProducts(0, 24, undefined, undefined, 'ACTIVE').subscribe({
      next: page => {
        const products = page.content || [];
        this.bestSellerProducts = products
          .sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || Number(b.featured) - Number(a.featured))
          .slice(0, 4);
        this.loadingProducts = false;
      },
      error: () => {
        this.bestSellerProducts = [];
        this.productError = 'Không tải được sản phẩm từ hệ thống.';
        this.loadingProducts = false;
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  navigateToMenu(): void {
    this.router.navigate(['/menu']);
  }

  navigateToStores(): void {
    this.router.navigate(['/stores']);
  }

  selectBranch(branch: Branch): void {
    this.selectedBranch = branch;
  }

  applyVoucher(voucherCode: string): void {
    console.log('Applying voucher:', voucherCode);
  }

  addToCart(product: Product): void {
    this.router.navigate(['/product', product.id]);
  }

  getProductBadge(product: Product): string {
    if (product.bestSeller) { return 'Best seller'; }
    if (product.featured) { return 'Nổi bật'; }
    return '';
  }

  private loadBranches(): void {
    this.branchError = '';
    this.branchService.getActiveBranches(0, 6).subscribe({
      next: page => {
        this.nearbyBranches = (page.content || []).slice(0, 4);
        this.selectedBranch = this.nearbyBranches[0] || null;
        this.loadBranchHours(this.nearbyBranches);
      },
      error: () => {
        this.nearbyBranches = [];
        this.selectedBranch = null;
        this.branchError = 'Không tải được chi nhánh từ hệ thống.';
      }
    });
  }

  getBranchDistance(index: number): string {
    return index === 0 ? 'Cửa hàng nổi bật' : `Chi nhánh ${index + 1}`;
  }

  getBranchHours(branch: Branch): string {
    const hours = this.branchHoursByBranchId[branch.id] || [];
    if (hours.length === 0) {
      return 'Chưa cập nhật giờ mở cửa';
    }

    const openDays = hours.filter(item => !item.closed);
    if (openDays.length === 0) {
      return 'Tạm đóng cả tuần';
    }

    const first = openDays[0];
    const sameTime = openDays.every(item => item.openTime === first.openTime && item.closeTime === first.closeTime);
    const days = this.compactDayRange(openDays.map(item => item.dayOfWeek));
    return sameTime
      ? `${days} · ${this.normalizeTime(first.openTime)} - ${this.normalizeTime(first.closeTime)}`
      : openDays.map(item => `${this.dayLabel(item.dayOfWeek)} ${this.normalizeTime(item.openTime)}-${this.normalizeTime(item.closeTime)}`).join(' · ');
  }

  getBranchServices(branch: Branch): string {
    const services = [];
    if (branch.supportsPickup) { services.push('Nhận tại quầy'); }
    if (branch.supportsDelivery) { services.push('Giao hàng'); }
    return services.length ? services.join(' · ') : 'Chưa bật dịch vụ';
  }

  getBranchContact(branch: Branch): string {
    return [branch.phone, branch.email].filter(Boolean).join(' · ') || 'Chưa cập nhật liên hệ';
  }

  private loadBranchHours(branches: Branch[]): void {
    this.branchHoursByBranchId = {};
    branches.forEach(branch => {
      this.branchService.getBranchHours(branch.id).subscribe({
        next: hours => {
          this.branchHoursByBranchId = {
            ...this.branchHoursByBranchId,
            [branch.id]: hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
          };
        }
      });
    });
  }

  private dayLabel(dayOfWeek: number): string {
    const labels: Record<number, string> = {
      1: 'T2',
      2: 'T3',
      3: 'T4',
      4: 'T5',
      5: 'T6',
      6: 'T7',
      7: 'CN'
    };
    return labels[dayOfWeek] || `Ngày ${dayOfWeek}`;
  }

  private compactDayRange(days: number[]): string {
    const sortedDays = [...days].sort((a, b) => a - b);
    if (sortedDays.length === 7) { return 'Cả tuần'; }
    if (sortedDays.join(',') === '1,2,3,4,5,6') { return 'T2 - T7'; }
    if (sortedDays.join(',') === '6,7') { return 'Cuối tuần'; }
    return sortedDays.map(day => this.dayLabel(day)).join(', ');
  }

  private normalizeTime(value: string): string {
    return value?.slice(0, 5) || '--:--';
  }
}
