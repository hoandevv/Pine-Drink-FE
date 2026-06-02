import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';
import { MOCK_BRANCHES, MOCK_VOUCHERS, MockBranch, MockVoucher } from '../../../../shared/mock-data';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  bestSellerProducts: Product[] = [];
  vouchers: MockVoucher[] = [];
  nearbyBranches: MockBranch[] = [];
  selectedBranch: MockBranch | null = null;
  loadingProducts = false;
  productError = '';

  constructor(
    private readonly router: Router,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadProducts();

    this.vouchers = MOCK_VOUCHERS
      .filter(voucher => voucher.isActive)
      .slice(0, 3);

    this.nearbyBranches = MOCK_BRANCHES
      .filter(branch => branch.isOpen)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 2);

    if (this.nearbyBranches.length > 0) {
      this.selectedBranch = this.nearbyBranches[0];
    }
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

  selectBranch(branch: MockBranch): void {
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
}
