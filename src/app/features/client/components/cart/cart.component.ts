import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_CART, MOCK_VOUCHERS, MockCartItem, MockVoucher, MockTopping } from '../../../../shared/mock-data';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartItems: MockCartItem[] = [];
  availableVouchers: MockVoucher[] = [];
  selectedVoucher: MockVoucher | null = null;
  voucherCode: string = '';
  
  subtotal: number = 0;
  shippingFee: number = 15000;
  discount: number = 0;
  total: number = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadVouchers();
    this.calculateTotal();
  }

  loadCart(): void {
    this.cartItems = [...MOCK_CART.items];
  }

  loadVouchers(): void {
    this.availableVouchers = MOCK_VOUCHERS.filter(v => v.isActive).slice(0, 3);
  }

  calculateTotal(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => {
      const toppingTotal = item.toppings.reduce((tSum, t) => tSum + t.price, 0);
      return sum + ((item.price + toppingTotal) * item.quantity);
    }, 0);

    // Apply voucher discount
    if (this.selectedVoucher) {
      if (this.selectedVoucher.discountType === 'PERCENTAGE') {
        this.discount = Math.min(
          (this.subtotal * this.selectedVoucher.discountValue) / 100,
          this.selectedVoucher.maxDiscountAmount || Infinity
        );
      } else if (this.selectedVoucher.discountType === 'FIXED_AMOUNT') {
        this.discount = this.selectedVoucher.discountValue;
      } else if (this.selectedVoucher.discountType === 'FREE_SHIPPING') {
        this.shippingFee = 0;
      }
    }

    this.total = this.subtotal + this.shippingFee - this.discount;
  }

  updateQuantity(item: MockCartItem, change: number): void {
    item.quantity += change;
    if (item.quantity < 1) {
      this.removeItem(item);
    } else {
      this.calculateTotal();
    }
  }

  removeItem(item: MockCartItem): void {
    const index = this.cartItems.findIndex(i => i.id === item.id);
    if (index > -1) {
      this.cartItems.splice(index, 1);
      this.calculateTotal();
    }
  }

  applyVoucher(voucher?: MockVoucher): void {
    if (voucher) {
      // Check minimum order amount
      if (this.subtotal < voucher.minOrderAmount) {
        alert(`Đơn hàng tối thiểu ${this.formatPrice(voucher.minOrderAmount)} để áp dụng mã này`);
        return;
      }
      this.selectedVoucher = voucher;
      this.voucherCode = voucher.code;
    } else {
      // Apply by code
      const foundVoucher = this.availableVouchers.find(v => v.code === this.voucherCode.toUpperCase());
      if (foundVoucher) {
        if (this.subtotal < foundVoucher.minOrderAmount) {
          alert(`Đơn hàng tối thiểu ${this.formatPrice(foundVoucher.minOrderAmount)} để áp dụng mã này`);
          return;
        }
        this.selectedVoucher = foundVoucher;
      } else {
        alert('Mã voucher không hợp lệ');
        return;
      }
    }
    this.calculateTotal();
  }

  removeVoucher(): void {
    this.selectedVoucher = null;
    this.voucherCode = '';
    this.shippingFee = 15000;
    this.calculateTotal();
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }
    // TODO: Navigate to checkout page
    console.log('Proceeding to checkout with:', {
      items: this.cartItems,
      voucher: this.selectedVoucher,
      total: this.total
    });
    alert('Chức năng thanh toán đang được phát triển');
  }

  continueShopping(): void {
    this.router.navigate(['/client/menu']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  getSizePrice(size: string): number {
    const sizeMultiplier = { S: 0.8, M: 1, L: 1.2 };
    return sizeMultiplier[size as keyof typeof sizeMultiplier] || 1;
  }
}
