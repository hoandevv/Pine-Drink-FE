import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { BranchProductAvailability } from '../../../branches/models/branch-availability.model';
import { Branch } from '../../../branches/models/branch.model';
import { BranchAvailabilityService } from '../../../branches/services/branch-availability.service';
import { BranchService } from '../../../branches/services/branch.service';
import { Category } from '../../../categories/models/category.model';
import { CategoryService } from '../../../categories/services/category.service';
import { Product } from '../../../products/models/product.model';
import { ProductService } from '../../../products/services/product.service';
import { CartItem, CartService } from '../../services/cart.service';

interface ClientCategoryTab {
  id: string;
  name: string;
  icon: string;
  count: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: ClientCategoryTab[] = [];
  selectedBranch: Branch | null = null;
  productAvailabilityMap = new Map<string, BranchProductAvailability>();
  cartItems: CartItem[] = [];

  selectedCategoryId = 'all';
  searchQuery = '';
  sortBy: 'best-seller' | 'newest' | 'price-low' = 'best-seller';
  currentPage = 1;
  pageSize = 6;
  loading = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly branchService: BranchService,
    private readonly branchAvailabilityService: BranchAvailabilityService,
    private readonly cartService: CartService,
    private readonly authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.loadCartData();

    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategoryId = params['category'];
        this.filterProducts();
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      productsPage: this.productService.getProducts(0, 100, '', '', 'ACTIVE'),
      categories: this.categoryService.getActiveCategories()
    }).subscribe({
      next: ({ productsPage, categories }) => {
        this.allProducts = productsPage.content.filter(product => product.status === 'ACTIVE');
        this.categories = this.buildCategoryTabs(categories);
        this.filteredProducts = [...this.allProducts];
        this.loadSelectedBranch();
        this.filterProducts();
        this.loading = false;
      },
      error: () => {
        this.allProducts = [];
        this.filteredProducts = [];
        this.categories = [{ id: 'all', name: 'Tất cả', icon: 'apps', count: 0 }];
        this.errorMessage = 'Không tải được menu từ server. Vui lòng thử lại sau.';
        this.loading = false;
      }
    });
  }

  loadCartData(): void {
    if (!this.authService.isAuthenticated()) {
      this.cartItems = [];
      return;
    }

    const branchId = this.selectedBranch?.id || sessionStorage.getItem('selectedBranchId') || '';
    if (!branchId) {
      this.cartItems = [];
      return;
    }

    this.cartService.getActiveCart(branchId).subscribe({
      next: cart => {
        this.cartItems = cart.items || [];
      },
      error: () => {
        this.cartItems = [];
      }
    });
  }

  filterProducts(): void {
    let filtered = [...this.allProducts];

    if (this.selectedBranch) {
      filtered = filtered.filter(product => !this.isProductSoldOut(product));
    }

    if (this.selectedCategoryId !== 'all') {
      filtered = filtered.filter(product => product.categoryId === this.selectedCategoryId);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.description || '').toLowerCase().includes(query) ||
        (product.categoryName || '').toLowerCase().includes(query)
      );
    }

    this.filteredProducts = filtered;
    this.currentPage = 1;
    this.sortProducts();
  }

  sortProducts(): void {
    switch (this.sortBy) {
      case 'best-seller':
        this.filteredProducts.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
        break;
      case 'newest':
        this.filteredProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
    }

    this.normalizeCurrentPage();
  }

  get pagedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const pages = new Set<number>([1, total, this.currentPage]);

    if (this.currentPage > 1) { pages.add(this.currentPage - 1); }
    if (this.currentPage < total) { pages.add(this.currentPage + 1); }

    return Array.from(pages).sort((a, b) => a - b);
  }

  get paginationStart(): number {
    return this.filteredProducts.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredProducts.length);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) { return; }
    this.currentPage = page;
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.filterProducts();
  }

  selectSort(sortBy: 'best-seller' | 'newest' | 'price-low'): void {
    this.sortBy = sortBy;
    this.sortProducts();
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.filterProducts();
  }

  addToCart(product: Product): void {
    if (this.isProductSoldOut(product)) { return; }
    const branchId = this.selectedBranch?.id || sessionStorage.getItem('selectedBranchId') || '';
    if (branchId && this.selectedBranch?.name) {
      sessionStorage.setItem('selectedBranchId', branchId);
      sessionStorage.setItem('selectedBranchName', this.selectedBranch.name);
    }
    this.router.navigate(['/product', product.id], { queryParams: branchId ? { branchId } : undefined });
  }

  viewCart(): void {
    this.router.navigate(['/cart']);
  }

  changeBranch(): void {
    this.router.navigate(['/stores']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  productImage(product: Product): string {
    return product.imageUrl || 'assets/images/product-placeholder.svg';
  }

  productBadge(product: Product): string {
    if (this.isProductSoldOut(product)) { return 'Hết hàng'; }
    if (product.bestSeller) { return 'Best seller'; }
    if (product.featured) { return 'Nổi bật'; }
    return '';
  }

  isProductSoldOut(product: Product): boolean {
    const availability = this.productAvailabilityMap.get(product.id);
    return !!availability && (availability.status !== 'ACTIVE' || !availability.available);
  }

  productDisplayPrice(product: Product): number {
    const availability = this.productAvailabilityMap.get(product.id);
    return availability?.salePrice ?? product.price;
  }

  get cartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get cartTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  private normalizeCurrentPage(): void {
    this.currentPage = Math.min(Math.max(this.currentPage, 1), this.totalPages);
  }

  private buildCategoryTabs(categories: Category[]): ClientCategoryTab[] {
    const activeCategories = categories.filter(category => category.status === 'ACTIVE');
    return [
      { id: 'all', name: 'Tất cả', icon: 'apps', count: this.allProducts.length },
      ...activeCategories.map(category => ({
        id: category.id,
        name: category.name,
        icon: this.categoryIcon(category.name),
        imageUrl: category.imageUrl,
        count: this.allProducts.filter(product => product.categoryId === category.id).length
      }))
    ];
  }

  private categoryIcon(name: string): string {
    const normalized = name.toLowerCase();
    if (normalized.includes('coffee') || normalized.includes('cà phê')) { return 'local_cafe'; }
    if (normalized.includes('tea') || normalized.includes('trà')) { return 'emoji_food_beverage'; }
    if (normalized.includes('juice') || normalized.includes('nước ép')) { return 'nutrition'; }
    if (normalized.includes('freeze') || normalized.includes('đá')) { return 'ac_unit'; }
    return 'local_drink';
  }

  private loadSelectedBranch(): void {
    const storedBranchId = sessionStorage.getItem('selectedBranchId') || '';
    const storedBranchName = sessionStorage.getItem('selectedBranchName') || '';

    this.branchService.getActiveBranches(0, 100).subscribe({
      next: page => {
        const branches = page.content || [];
        const storedBranch = branches.find(branch => branch.id === storedBranchId);
        const fallbackBranch = branches[0] || null;
        this.selectedBranch = storedBranch || fallbackBranch;

        if (this.selectedBranch) {
          sessionStorage.setItem('selectedBranchId', this.selectedBranch.id);
          sessionStorage.setItem('selectedBranchName', this.selectedBranch.name);
          this.loadProductAvailabilities(this.selectedBranch.id);
          this.loadCartData();
        }
      },
      error: () => {
        this.selectedBranch = storedBranchId
          ? ({ id: storedBranchId, name: storedBranchName || 'Chi nhánh đã chọn', status: 'ACTIVE' } as Branch)
          : null;

        if (storedBranchId) {
          this.loadProductAvailabilities(storedBranchId);
          this.loadCartData();
        }
      }
    });
  }

  private loadProductAvailabilities(branchId: string): void {
    this.productAvailabilityMap.clear();

    this.branchAvailabilityService.getProductAvailabilities(branchId).subscribe({
      next: availabilities => {
        this.productAvailabilityMap = new Map(
          availabilities
            .filter(item => item.productId)
            .map(item => [item.productId, item])
        );
        this.filterProducts();
      },
      error: () => {
        this.productAvailabilityMap.clear();
        this.filterProducts();
      }
    });
  }
}
