import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  MOCK_CART,
  MOCK_TOPPINGS,
  MockCartItem,
  MockTopping
} from '../../../../shared/mock-data';
import { Product } from '../../../products/models/product.model';
import { ProductVariant } from '../../../products/models/product-variant.model';
import { ProductService } from '../../../products/services/product.service';
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
    private readonly productVariantService: ProductVariantService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      this.loadProduct(productId);
    });
    this.loadToppings();
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
      },
      error: () => {
        this.product = null;
        this.errorMessage = 'Không tải được chi tiết sản phẩm.';
        this.loading = false;
      }
    });
  }

  loadToppings(): void {
    this.availableToppings = MOCK_TOPPINGS.filter(t => t.isAvailable);
  }

  selectSize(sizeId: string): void {
    this.selectedSize = sizeId;
    this.selectedVariant = this.sizeOptions.find(size => size.id === sizeId)?.variant || null;
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
    if (this.quantity < 99) {
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
    if (this.product.bestSeller) { return 'Best seller'; }
    if (this.product.featured) { return 'Nổi bật'; }
    return '';
  }

  addToCart(): void {
    if (!this.product) { return; }

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
}
