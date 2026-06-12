import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MOCK_CART, MockCartItem, MockTopping } from '../../../../shared/mock-data';
import { BranchProductAvailability, BranchToppingAvailability } from '../../../branches/models/branch-availability.model';
import { Branch } from '../../../branches/models/branch.model';
import { BranchAvailabilityService } from '../../../branches/services/branch-availability.service';
import { BranchService } from '../../../branches/services/branch.service';
import { Product } from '../../../products/models/product.model';
import { DailyStock } from '../../../products/models/daily-stock.model';
import { ProductTopping } from '../../../products/models/product-topping.model';
import { ProductVariant } from '../../../products/models/product-variant.model';
import { DailyStockService } from '../../../products/services/daily-stock.service';
import { ProductService } from '../../../products/services/product.service';
import { ProductToppingService } from '../../../products/services/product-topping.service';
import { ProductVariantService } from '../../../products/services/product-variant.service';

interface SizeOption {
  id: string;
  label: string;
  priceModifier: number;
  finalPrice?: number;
  variant?: ProductVariant;
}

interface LevelOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  availableToppings: MockTopping[] = [];
  loading = false;
  errorMessage = '';

  branches: Branch[] = [];
  selectedBranchId = '';
  selectedBranchName = '';
  branchProductAvailability: BranchProductAvailability | null = null;
  branchToppingAvailabilities: BranchToppingAvailability[] = [];
  dailyStocks: DailyStock[] = [];
  availabilityLoading = false;
  quotaLoading = false;

  selectedSize = '';
  selectedVariant: ProductVariant | null = null;
  selectedIceLevel = 70;
  selectedSugarLevel = 100;
  selectedToppings: MockTopping[] = [];
  quantity = 1;
  note = '';

  sizeOptions: SizeOption[] = [];

  iceLevelOptions: LevelOption[] = [
    { value: 0, label: '0%' },
    { value: 30, label: '30%' },
    { value: 50, label: '50%' },
    { value: 70, label: '70%' },
    { value: 100, label: '100%' }
  ];

  sugarLevelOptions: LevelOption[] = [
    { value: 0, label: '0%' },
    { value: 30, label: '30%' },
    { value: 50, label: '50%' },
    { value: 70, label: '70%' },
    { value: 100, label: '100%' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly productService: ProductService,
    private readonly productToppingService: ProductToppingService,
    private readonly productVariantService: ProductVariantService,
    private readonly branchService: BranchService,
    private readonly branchAvailabilityService: BranchAvailabilityService,
    private readonly dailyStockService: DailyStockService
  ) {}

  ngOnInit(): void {
    this.loadBranches();
    this.route.params.subscribe(params => {
      const productId = params['id'];
      this.loadProduct(productId);
    });
  }

  loadProduct(productId: string): void {
    if (!productId) {
      this.router.navigate(['/menu']);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.productService.getProductById(productId).subscribe({
      next: product => {
        if (product.status !== 'ACTIVE') {
          this.router.navigate(['/menu']);
          return;
        }

        this.product = product;
        this.loading = false;
        this.loadVariants(product.id);
        this.loadProductToppings(product.id);
      },
      error: () => {
        this.product = null;
        this.errorMessage = 'Không tải được chi tiết sản phẩm.';
        this.loading = false;
      }
    });
  }

  loadToppings(): void {
    this.availableToppings = [];
  }

  selectBranch(branchId: string): void {
    if (this.selectedBranchId === branchId) { return; }
    this.selectedBranchId = branchId;
    this.refreshAvailability();
  }

  selectSize(sizeId: string): void {
    const option = this.visibleSizeOptions.find(size => size.id === sizeId) || this.sizeOptions.find(size => size.id === sizeId);
    if (!option) { return; }
    this.selectedSize = option.id;
    this.selectedVariant = option.variant || null;
    this.normalizeQuantityToStock();
  }

  selectIceLevel(level: number): void {
    this.selectedIceLevel = level;
  }

  selectSugarLevel(level: number): void {
    this.selectedSugarLevel = level;
  }

  toggleTopping(topping: MockTopping): void {
    const index = this.selectedToppings.findIndex(t => t.id === topping.id);
    if (index > -1) {
      this.selectedToppings.splice(index, 1);
    } else {
      this.selectedToppings.push(topping);
    }
  }

  isToppingSelected(topping: MockTopping): boolean {
    return this.selectedToppings.some(t => t.id === topping.id);
  }

  incrementQuantity(): void {
    const max = this.maxOrderQuantity;
    if (this.quantity < max) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  get basePrice(): number {
    if (!this.product) { return 0; }
    if (this.selectedVariant?.finalPrice !== undefined) {
      return this.selectedVariant.finalPrice;
    }

    const branchPrice = this.branchProductAvailability?.salePrice;
    if (branchPrice !== null && branchPrice !== undefined && Number(branchPrice) > 0) {
      return Number(branchPrice);
    }

    const sizeOption = this.sizeOptions.find(s => s.id === this.selectedSize);
    return this.product.price + (sizeOption?.priceModifier || 0);
  }

  get toppingsPrice(): number {
    return this.selectedToppings.reduce((sum, t) => sum + t.price, 0);
  }

  get itemPrice(): number {
    return this.basePrice + this.toppingsPrice;
  }

  get totalPrice(): number {
    return this.itemPrice * this.quantity;
  }

  get productBadge(): string {
    if (!this.product) { return ''; }
    if (this.selectedDailyStock && this.selectedDailyStock.availableQuantity <= 0) { return 'Hết quota'; }
    if (this.product.bestSeller) { return 'Best seller'; }
    if (this.product.featured) { return 'Nổi bật'; }
    return '';
  }

  get selectedDailyStock(): DailyStock | null {
    if (!this.selectedVariant) { return null; }
    return this.dailyStocks.find(stock => stock.variantId === this.selectedVariant?.id) || null;
  }

  get availableQuota(): number | null {
    const stock = this.selectedDailyStock;
    return stock ? Math.max(0, Number(stock.availableQuantity) || 0) : null;
  }

  get maxOrderQuantity(): number {
    const quota = this.availableQuota;
    return quota === null ? 99 : Math.max(0, Math.min(99, quota));
  }

  get quotaStatusLabel(): string {
    if (this.quotaLoading) { return 'Đang kiểm tra quota'; }
    if (!this.selectedVariant) { return 'Chọn size để xem quota'; }
    if (!this.selectedBranchId) { return 'Chọn chi nhánh để xem quota'; }
    if (!this.selectedDailyStock) { return 'Chi nhánh chưa set quota hôm nay'; }
    if ((this.availableQuota || 0) <= 0) { return 'Hết quota hôm nay'; }
    if ((this.availableQuota || 0) <= 5) { return `Sắp hết · còn ${this.availableQuota} phần`; }
    return `Còn ${this.availableQuota} phần hôm nay`;
  }

  get quotaTone(): 'ok' | 'low' | 'out' | 'unset' {
    if (!this.selectedDailyStock) { return 'unset'; }
    if ((this.availableQuota || 0) <= 0) { return 'out'; }
    if ((this.availableQuota || 0) <= 5) { return 'low'; }
    return 'ok';
  }

  get visibleSizeOptions(): SizeOption[] {
    if (!this.dailyStocks.length) { return this.sizeOptions; }
    return this.sizeOptions.filter(size => !size.variant || this.hasQuotaForVariant(size.variant.id));
  }

  private hasQuotaForVariant(variantId: string): boolean {
    return this.dailyStocks.some(stock => stock.variantId === variantId);
  }
  addToCart(): void {
    if (!this.product || this.isProductUnavailable) { return; }

    const newItem: MockCartItem = {
      id: `cart-item-${Date.now()}`,
      productId: this.product.id,
      productName: this.product.name,
      productImage: this.product.imageUrl || '',
      quantity: this.quantity,
      price: this.basePrice,
      size: this.selectedVariant?.sizeLabel || this.selectedSize,
      iceLevel: this.selectedIceLevel,
      sugarLevel: this.selectedSugarLevel,
      toppings: [...this.selectedToppings],
      note: this.note.trim() || undefined
    };

    MOCK_CART.items.push(newItem);
    alert(`Đã thêm ${this.quantity} ${this.product.name} vào giỏ hàng!`);
    this.router.navigate(['/cart']);
  }

  goBack(): void {
    this.location.back();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  getToppingsByCategory(category: string): MockTopping[] {
    return this.availableToppings.filter(t => t.category === category);
  }

  get selectedBranch(): Branch | null {
    return this.branches.find(branch => branch.id === this.selectedBranchId) || null;
  }

  get isProductUnavailable(): boolean {
    const availability = this.branchProductAvailability;
    if (!availability) { return this.availableQuota !== null && this.availableQuota <= 0; }
    return availability.status !== 'ACTIVE' || !availability.available || !this.isWithinAvailabilityWindow(availability) || (this.availableQuota !== null && this.availableQuota <= 0);
  }

  get availabilityText(): string {
    if (!this.selectedBranch) { return 'Chọn chi nhánh để kiểm tra tồn hàng.'; }
    if (!this.branchProductAvailability) { return 'Chi nhánh này chưa có cấu hình riêng, dùng trạng thái mặc định.'; }
    if (this.isProductUnavailable) {
      return this.branchProductAvailability.soldOutReason || 'Tạm hết món tại chi nhánh này.';
    }
    return 'Sẵn sàng phục vụ tại chi nhánh đã chọn.';
  }

  get branchSaleHint(): string {
    const salePrice = this.branchProductAvailability?.salePrice;
    if (salePrice === null || salePrice === undefined || Number(salePrice) <= 0) { return ''; }
    return `Giá tại ${this.selectedBranch?.name || this.selectedBranchName || 'chi nhánh'}: ${this.formatPrice(Number(salePrice))}`;
  }

  get toppingCategories(): string[] {
    const categories = new Set(this.availableToppings.map(t => t.category));
    return Array.from(categories);
  }

  private loadVariants(productId: string): void {
    this.productVariantService.getActiveVariants(productId).subscribe({
      next: variants => {
        this.sizeOptions = this.mapVariantsToSizeOptions(variants);
        this.selectSize(this.sizeOptions[0]?.id || '');
      },
      error: () => {
        this.sizeOptions = this.product ? [{ id: 'default', label: 'Mặc định', priceModifier: 0 }] : [];
        this.selectSize(this.sizeOptions[0]?.id || '');
      }
    });
  }

  private mapVariantsToSizeOptions(variants: ProductVariant[]): SizeOption[] {
    if (!variants.length) {
      return [{ id: 'default', label: 'Mặc định', priceModifier: 0 }];
    }

    return variants
      .filter(variant => variant.status === 'ACTIVE')
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map(variant => ({
        id: variant.id,
        label: variant.sizeLabel || variant.variantName,
        priceModifier: Number(variant.priceDelta) || 0,
        finalPrice: Number(variant.finalPrice) || undefined,
        variant
      }));
  }

  private loadProductToppings(productId: string): void {
    this.productToppingService.getActiveProductToppings(productId).subscribe({
      next: productToppings => {
        const mappedToppings = this.mapProductToppings(productToppings);
        this.availableToppings = this.applyToppingAvailability(mappedToppings);
        this.selectedToppings = this.selectedToppings.filter(topping =>
          this.availableToppings.some(available => available.id === topping.id)
        );
      },
      error: () => {
        this.availableToppings = [];
        this.selectedToppings = [];
      }
    });
  }

  private mapProductToppings(productToppings: ProductTopping[]): MockTopping[] {
    return productToppings
      .filter(item => item.status === 'ACTIVE')
      .map(item => ({
        id: item.toppingId || item.id,
        name: item.toppingName,
        price: Number(item.toppingPrice) || 0,
        isAvailable: item.status === 'ACTIVE',
        category: item.toppingGroupName || 'Khác',
        image: item.toppingImageUrl || undefined
      }));
  }

  private loadBranches(): void {
    this.branchService.getActiveBranches(0, 100).subscribe({
      next: page => {
        this.branches = page.content || [];
        const storedBranchId = sessionStorage.getItem('selectedBranchId') || '';
        const storedBranchName = sessionStorage.getItem('selectedBranchName') || '';
        const storedBranch = this.branches.find(branch => branch.id === storedBranchId);
        const fallbackBranch = this.branches[0];

        this.selectedBranchId = storedBranch?.id || fallbackBranch?.id || '';
        this.selectedBranchName = storedBranch?.name || storedBranchName || fallbackBranch?.name || '';
        this.refreshAvailability();
      },
      error: () => {
        this.branches = [];
        this.selectedBranchId = sessionStorage.getItem('selectedBranchId') || '';
        this.selectedBranchName = sessionStorage.getItem('selectedBranchName') || '';
      }
    });
  }

  private refreshAvailability(): void {
    if (!this.selectedBranchId) { return; }
    this.loadBranchProductAvailability();
    this.loadDailyStocks();
    if (this.product) {
      this.loadProductToppings(this.product.id);
    }
  }

  private loadBranchProductAvailability(): void {
    if (!this.selectedBranchId || !this.product) { return; }

    this.availabilityLoading = true;
    this.branchAvailabilityService.getProductAvailabilities(this.selectedBranchId).subscribe({
      next: availabilities => {
        this.branchProductAvailability = availabilities.find(item => item.productId === this.product?.id) || null;
        this.availabilityLoading = false;
      },
      error: () => {
        this.branchProductAvailability = null;
        this.availabilityLoading = false;
      }
    });
  }

  private loadDailyStocks(): void {
    if (!this.selectedBranchId) { return; }

    this.quotaLoading = true;
    this.dailyStockService.getByBranchAndDate(this.selectedBranchId, this.todayKey()).subscribe({
      next: stocks => {
        this.dailyStocks = stocks || [];
        this.quotaLoading = false;
        this.normalizeQuantityToStock();
      },
      error: () => {
        this.dailyStocks = [];
        this.quotaLoading = false;
      }
    });
  }

  private normalizeQuantityToStock(): void {
    if (this.visibleSizeOptions.length && !this.visibleSizeOptions.some(size => size.id === this.selectedSize)) {
      this.selectSize(this.visibleSizeOptions[0].id);
      return;
    }

    const max = this.maxOrderQuantity;
    if (max <= 0) {
      this.quantity = 1;
      return;
    }
    this.quantity = Math.min(Math.max(this.quantity, 1), max);
  }

  private todayKey(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  private applyToppingAvailability(toppings: MockTopping[]): MockTopping[] {
    if (!this.selectedBranchId) { return toppings; }

    this.branchAvailabilityService.getToppingAvailabilities(this.selectedBranchId).subscribe({
      next: availabilities => {
        this.branchToppingAvailabilities = availabilities;
        this.availableToppings = this.filterToppingsByAvailability(toppings, availabilities);
        this.selectedToppings = this.selectedToppings.filter(topping =>
          this.availableToppings.some(available => available.id === topping.id)
        );
      },
      error: () => {
        this.branchToppingAvailabilities = [];
        this.availableToppings = toppings;
      }
    });

    return toppings;
  }

  private filterToppingsByAvailability(
    toppings: MockTopping[],
    availabilities: BranchToppingAvailability[]
  ): MockTopping[] {
    if (!availabilities.length) { return toppings; }

    return toppings.filter(topping => {
      const availability = availabilities.find(item => item.toppingId === topping.id);
      return !availability || (availability.status === 'ACTIVE' && availability.available);
    });
  }

  private isWithinAvailabilityWindow(availability: BranchProductAvailability): boolean {
    const now = Date.now();
    const from = availability.availableFrom ? new Date(availability.availableFrom).getTime() : null;
    const to = availability.availableTo ? new Date(availability.availableTo).getTime() : null;

    return (!from || now >= from) && (!to || now <= to);
  }
}
