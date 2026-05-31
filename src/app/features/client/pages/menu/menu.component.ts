import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  MOCK_PRODUCTS, 
  MOCK_CATEGORIES, 
  MOCK_BRANCHES, 
  MOCK_CART,
  MockProduct, 
  MockCategory, 
  MockBranch,
  MockCartItem 
} from '../../../../shared/mock-data';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  allProducts: MockProduct[] = [];
  filteredProducts: MockProduct[] = [];
  categories: MockCategory[] = [];
  selectedBranch: MockBranch | null = null;
  cartItems: MockCartItem[] = [];
  
  selectedCategoryId: string = 'all';
  searchQuery: string = '';
  sortBy: 'best-seller' | 'newest' | 'price-low' = 'best-seller';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadCartData();
    
    // Check for category query param
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategoryId = params['category'];
        this.filterProducts();
      }
    });
  }

  loadData(): void {
    // Load all products
    this.allProducts = MOCK_PRODUCTS.filter(p => p.isAvailable);
    this.filteredProducts = [...this.allProducts];

    // Load categories with "All" option
    this.categories = [
      { id: 'all', name: 'Tất cả', icon: 'apps', count: this.allProducts.length, color: '#f4fafd', description: 'Tất cả sản phẩm', isActive: true },
      ...MOCK_CATEGORIES.filter(cat => cat.isActive)
    ];

    // Load selected branch (nearest by default)
    const branches = MOCK_BRANCHES.filter(b => b.isOpen).sort((a, b) => a.distanceKm - b.distanceKm);
    if (branches.length > 0) {
      this.selectedBranch = branches[0];
    }

    this.sortProducts();
  }

  loadCartData(): void {
    this.cartItems = MOCK_CART.items;
  }

  filterProducts(): void {
    let filtered = [...this.allProducts];

    // Filter by category
    if (this.selectedCategoryId !== 'all') {
      filtered = filtered.filter(p => p.categoryId === this.selectedCategoryId);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    this.filteredProducts = filtered;
    this.sortProducts();
  }

  sortProducts(): void {
    switch (this.sortBy) {
      case 'best-seller':
        this.filteredProducts.sort((a, b) => {
          if (a.isBestSeller && !b.isBestSeller) return -1;
          if (!a.isBestSeller && b.isBestSeller) return 1;
          return b.rating - a.rating;
        });
        break;
      case 'newest':
        this.filteredProducts.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        });
        break;
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
    }
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.filterProducts();
  }

  selectSort(sortBy: 'best-seller' | 'newest' | 'price-low'): void {
    this.sortBy = sortBy;
    this.sortProducts();
  }

  onSearchChange(): void {
    this.filterProducts();
  }

  addToCart(product: MockProduct): void {
    // Navigate to product detail page for customization
    this.router.navigate(['/product', product.id]);
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

  get cartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get cartTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
}
