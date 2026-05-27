import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { 
  MOCK_PRODUCTS, 
  MOCK_TOPPINGS,
  MOCK_CART,
  MockProduct, 
  MockTopping,
  MockCartItem 
} from '../../../../shared/mock-data';

interface SizeOption {
  id: 'S' | 'M' | 'L';
  label: string;
  priceModifier: number;
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
  product: MockProduct | null = null;
  availableToppings: MockTopping[] = [];
  
  // Customization options
  selectedSize: 'S' | 'M' | 'L' = 'M';
  selectedIceLevel: number = 70;
  selectedSugarLevel: number = 100;
  selectedToppings: MockTopping[] = [];
  quantity: number = 1;
  note: string = '';

  sizeOptions: SizeOption[] = [
    { id: 'S', label: 'Nhỏ', priceModifier: -5000 },
    { id: 'M', label: 'Vừa', priceModifier: 0 },
    { id: 'L', label: 'Lớn', priceModifier: 5000 }
  ];

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
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      this.loadProduct(productId);
    });
    this.loadToppings();
  }

  loadProduct(productId: string): void {
    const foundProduct = MOCK_PRODUCTS.find(p => p.id === productId);
    if (foundProduct) {
      this.product = foundProduct;
    } else {
      // Product not found, redirect to menu
      this.router.navigate(['/menu']);
    }
  }

  loadToppings(): void {
    this.availableToppings = MOCK_TOPPINGS.filter(t => t.isAvailable);
  }

  selectSize(size: 'S' | 'M' | 'L'): void {
    this.selectedSize = size;
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
    if (!this.product) return 0;
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

  addToCart(): void {
    if (!this.product) return;

    const newItem: MockCartItem = {
      id: `cart-item-${Date.now()}`,
      productId: this.product.id,
      productName: this.product.name,
      productImage: this.product.image,
      quantity: this.quantity,
      price: this.basePrice,
      size: this.selectedSize,
      iceLevel: this.selectedIceLevel,
      sugarLevel: this.selectedSugarLevel,
      toppings: [...this.selectedToppings],
      note: this.note.trim() || undefined
    };

    MOCK_CART.items.push(newItem);
    
    // Show success message and navigate to cart or back
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
}
