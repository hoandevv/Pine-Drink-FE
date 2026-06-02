import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';
import { Branch } from '../../../branches/models/branch.model';
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
        this.nearbyBranches = (page.content || []).slice(0, 2);
        this.selectedBranch = this.nearbyBranches[0] || null;
      },
      error: () => {
        this.nearbyBranches = [];
        this.selectedBranch = null;
        this.branchError = 'Không tải được chi nhánh từ hệ thống.';
      }
    });
  }

  getBranchDistance(index: number): string {
    return `${index + 1} chi nhánh`;
  }

  getBranchHours(branch: Branch): string {
    return branch.averagePreparationMinutes ? `Chuẩn bị ${branch.averagePreparationMinutes} phút` : 'Đang mở';
  }
}
