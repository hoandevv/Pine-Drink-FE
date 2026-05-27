import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BRANCHES, MOCK_VOUCHERS, MockProduct, MockCategory, MockBranch, MockVoucher } from '../../../../shared/mock-data';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  categories: MockCategory[] = [];
  bestSellerProducts: MockProduct[] = [];
  vouchers: MockVoucher[] = [];
  nearbyBranches: MockBranch[] = [];
  selectedBranch: MockBranch | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Load categories
    this.categories = MOCK_CATEGORIES.filter(cat => cat.isActive);

    // Load best seller products
    this.bestSellerProducts = MOCK_PRODUCTS
      .filter(product => product.isBestSeller && product.isAvailable)
      .slice(0, 4);

    // Load active vouchers
    this.vouchers = MOCK_VOUCHERS
      .filter(voucher => voucher.isActive)
      .slice(0, 3);

    // Load nearby branches (sorted by distance)
    this.nearbyBranches = MOCK_BRANCHES
      .filter(branch => branch.isOpen)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 2);

    // Set default selected branch (nearest)
    if (this.nearbyBranches.length > 0) {
      this.selectedBranch = this.nearbyBranches[0];
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  navigateToMenu(): void {
    this.router.navigate(['/client/menu']);
  }

  navigateToStores(): void {
    this.router.navigate(['/client/stores']);
  }

  navigateToCategory(categoryId: string): void {
    this.router.navigate(['/client/menu'], { queryParams: { category: categoryId } });
  }

  selectBranch(branch: MockBranch): void {
    this.selectedBranch = branch;
  }

  applyVoucher(voucherCode: string): void {
    console.log('Applying voucher:', voucherCode);
    // TODO: Implement voucher application logic
  }

  addToCart(product: MockProduct): void {
    // Navigate to product detail page for customization
    this.router.navigate(['/product', product.id]);
  }
}
