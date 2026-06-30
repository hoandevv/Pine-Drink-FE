import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';
import { Branch } from '../../../branches/models/branch.model';
import { BranchHours } from '../../../branches/models/branch-hours.model';
import { BranchService } from '../../../branches/services/branch.service';
import { VoucherResponse, VoucherService } from '../../../vouchers/services/voucher.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  bestSellerProducts: Product[] = [];
  activeHeroIndex = 0;
  private heroRotationTimer?: ReturnType<typeof setInterval>;
  vouchers: VoucherResponse[] = [];
  nearbyBranches: Branch[] = [];
  selectedBranch: Branch | null = null;
  loadingProducts = false;
  productError = '';
  branchError = '';
  branchHoursByBranchId: Record<string, BranchHours[]> = {};
  orderMode: 'PICKUP' | 'DELIVERY' = 'PICKUP';

  constructor(
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly branchService: BranchService,
    private readonly voucherService: VoucherService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.stopHeroRotation();
  }

  loadData(): void {
    this.loadProducts();
    this.loadBranches();
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productError = '';
    this.productService.getProducts(0, 24, undefined, undefined, 'ACTIVE').subscribe({
      next: page => {
        const products = (page.content || []).filter(product => product.status === 'ACTIVE');
        this.bestSellerProducts = products
          .sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || Number(b.featured) - Number(a.featured))
          .slice(0, 4);
        this.startHeroRotation();
        this.loadingProducts = false;
      },
      error: () => {
        this.bestSellerProducts = [];
        this.productError = 'Không tải được sản phẩm từ hệ thống.';
        this.loadingProducts = false;
      }
    });
  }

  get heroProduct(): Product | null {
    return this.bestSellerProducts[this.activeHeroIndex] || this.bestSellerProducts[0] || null;
  }

  private startHeroRotation(): void {
    this.stopHeroRotation();
    this.activeHeroIndex = 0;
    if (this.bestSellerProducts.length <= 1) { return; }

    this.heroRotationTimer = setInterval(() => {
      this.activeHeroIndex = (this.activeHeroIndex + 1) % this.bestSellerProducts.length;
    }, 3200);
  }

  private stopHeroRotation(): void {
    if (!this.heroRotationTimer) { return; }
    clearInterval(this.heroRotationTimer);
    this.heroRotationTimer = undefined;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  navigateToMenu(): void {
    this.persistOrderContext();
    this.router.navigate(['/menu'], {
      queryParams: this.selectedBranch ? { branchId: this.selectedBranch.id, mode: this.orderMode } : { mode: this.orderMode }
    });
  }

  navigateToStores(): void {
    this.router.navigate(['/stores']);
  }

  selectBranch(branch: Branch): void {
    this.selectedBranch = branch;
    this.ensureSupportedOrderMode();
    this.persistOrderContext();
    this.loadVouchers();
  }

  selectOrderMode(mode: 'PICKUP' | 'DELIVERY'): void {
    if (!this.canUseOrderMode(mode)) { return; }
    this.orderMode = mode;
    this.persistOrderContext();
  }

  canUseOrderMode(mode: 'PICKUP' | 'DELIVERY', branch: Branch | null = this.selectedBranch): boolean {
    if (!branch) { return false; }
    return mode === 'PICKUP' ? branch.supportsPickup !== false : branch.supportsDelivery === true;
  }

  applyVoucher(voucherCode: string): void {
    navigator.clipboard?.writeText(voucherCode);
    this.router.navigate(['/promotions']);
  }

  private loadVouchers(): void {
    const branchId = this.selectedBranch?.id || sessionStorage.getItem('selectedBranchId') || '';
    if (!branchId) {
      this.vouchers = [];
      return;
    }

    this.voucherService.getAvailableForCustomer({ branchId, page: 0, size: 3, sort: 'createdAt,desc' }).subscribe({
      next: res => this.vouchers = res.data.content || [],
      error: () => this.vouchers = []
    });
  }

  addToCart(product: Product): void {
    this.persistOrderContext();
    const branchId = this.selectedBranch?.id || sessionStorage.getItem('selectedBranchId') || '';
    this.router.navigate(['/product', product.id], {
      queryParams: branchId ? { branchId, mode: this.orderMode } : { mode: this.orderMode }
    });
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
        const storedBranchId = sessionStorage.getItem('selectedBranchId') || '';
        const storedBranch = this.nearbyBranches.find(branch => branch.id === storedBranchId);
        this.selectedBranch = storedBranch || this.nearbyBranches[0] || null;
        this.orderMode = this.normalizeOrderMode(sessionStorage.getItem('selectedOrderMode'));
        this.ensureSupportedOrderMode();
        this.persistOrderContext();
        this.loadVouchers();
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

  private ensureSupportedOrderMode(): void {
    if (this.canUseOrderMode(this.orderMode)) { return; }
    if (this.canUseOrderMode('PICKUP')) {
      this.orderMode = 'PICKUP';
      return;
    }
    if (this.canUseOrderMode('DELIVERY')) {
      this.orderMode = 'DELIVERY';
    }
  }

  private persistOrderContext(): void {
    if (this.selectedBranch) {
      sessionStorage.setItem('selectedBranchId', this.selectedBranch.id);
      sessionStorage.setItem('selectedBranchName', this.selectedBranch.name);
    }
    sessionStorage.setItem('selectedOrderMode', this.orderMode);
  }

  private normalizeOrderMode(value: string | null): 'PICKUP' | 'DELIVERY' {
    return value === 'DELIVERY' ? 'DELIVERY' : 'PICKUP';
  }
}
