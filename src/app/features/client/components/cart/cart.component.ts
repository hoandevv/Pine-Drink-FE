import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MOCK_VOUCHERS, MockVoucher } from '../../../../shared/mock-data';
import { CartItem, CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  availableVouchers: MockVoucher[] = [];
  selectedVoucher: MockVoucher | null = null;
  voucherCode: string = '';
  loading = false;
  errorMessage = '';

  subtotal: number = 0;
  shippingFee: number = 15000;
  discount: number = 0;
  total: number = 0;

  constructor(
    private readonly router: Router,
    private readonly cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadVouchers();
  }

  loadCart(): void {
    const branchId = sessionStorage.getItem('selectedBranchId') || '';
    if (!branchId) {
      this.cartItems = [];
      this.errorMessage = 'Vui lòng chọn chi nhánh trước khi xem giỏ hàng.';
      this.calculateTotal();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cartService.getActiveCart(branchId).subscribe({
      next: cart => {
        this.cartItems = cart.items || [];
        this.loading = false;
        this.calculateTotal();
      },
      error: () => {
        this.cartItems = [];
        this.loading = false;
        this.errorMessage = 'Không tải được giỏ hàng. Vui lòng đăng nhập hoặc thử lại.';
        this.calculateTotal();
      }
    });
  }

  loadVouchers(): void {
    this.availableVouchers = MOCK_VOUCHERS.filter(v => v.isActive).slice(0, 3);
  }

  calculateTotal(): void {
    this.shippingFee = this.selectedVoucher?.discountType === 'FREE_SHIPPING' ? 0 : 15000;
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    this.discount = 0;

    if (this.selectedVoucher) {
      if (this.selectedVoucher.discountType === 'PERCENTAGE') {
        this.discount = Math.min(
          (this.subtotal * this.selectedVoucher.discountValue) / 100,
          this.selectedVoucher.maxDiscountAmount || Infinity
        );
      } else if (this.selectedVoucher.discountType === 'FIXED_AMOUNT') {
        this.discount = this.selectedVoucher.discountValue;
      }
    }

    this.total = Math.max(0, this.subtotal + this.shippingFee - this.discount);
  }

  updateQuantity(item: CartItem, change: number): void {
    item.quantity += change;
    if (item.quantity < 1) {
      this.removeItem(item);
      return;
    }
    item.totalPrice = (item.unitPrice + item.toppingAmount) * item.quantity;
    this.calculateTotal();
  }

  removeItem(item: CartItem): void {
    const index = this.cartItems.findIndex(i => i.id === item.id);
    if (index > -1) {
      this.cartItems.splice(index, 1);
      this.calculateTotal();
    }
  }

  applyVoucher(voucher?: MockVoucher): void {
    if (voucher) {
      if (this.subtotal < voucher.minOrderAmount) {
        alert(`Đơn hàng tối thiểu ${this.formatPrice(voucher.minOrderAmount)} để áp dụng mã này`);
        return;
      }
      this.selectedVoucher = voucher;
      this.voucherCode = voucher.code;
    } else {
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
    this.calculateTotal();
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }
    alert('Chức năng thanh toán đang được phát triển');
  }

  continueShopping(): void {
    this.router.navigate(['/menu']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }
}
