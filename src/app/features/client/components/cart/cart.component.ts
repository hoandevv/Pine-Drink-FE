import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Branch } from '../../../branches/models/branch.model';
import { BranchService } from '../../../branches/services/branch.service';
import { CreateOrderRequest } from '../../../orders/models/order.model';
import { OrderService } from '../../../orders/services/order.service';
import { PaymentService } from '../../../orders/services/payment.service';
import { VoucherResponse, VoucherService } from '../../../vouchers/services/voucher.service';
import { CustomerAddressService } from '../../../../core/services/customer-address.service';
import { CustomerAddress } from '../../../../shared/models/customer-address.model';
import { CartItem, CartService } from '../../services/cart.service';
import { BranchAvailabilityService } from '../../../branches/services/branch-availability.service';
import { DailyStockService } from '../../../products/services/daily-stock.service';
import { BranchProductAvailability } from '../../../branches/models/branch-availability.model';
import { DailyStock } from '../../../products/models/daily-stock.model';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  availableVouchers: VoucherResponse[] = [];
  selectedVoucher: VoucherResponse | null = null;
  voucherCode: string = '';
  addresses: CustomerAddress[] = [];
  selectedAddressId = '';
  selectedBranch: Branch | null = null;
  orderType: 'DELIVERY' | 'PICKUP' = this.normalizeOrderMode(sessionStorage.getItem('selectedOrderMode'));
  paymentMethod: 'COD' | 'CASH' | 'MOMO' = this.orderType === 'DELIVERY' ? 'COD' : 'CASH';
  note = '';
  loading = false;
  checkingOut = false;
  errorMessage = '';
  deliveryError = '';

  dailyStocks: DailyStock[] = [];
  branchProductAvailabilities: BranchProductAvailability[] = [];
  checkingAvailability = false;

  subtotal: number = 0;
  shippingFee: number = 15000;
  discount: number = 0;
  total: number = 0;

  constructor(
    private readonly router: Router,
    private readonly cartService: CartService,
    private readonly voucherService: VoucherService,
    private readonly branchService: BranchService,
    private readonly addressService: CustomerAddressService,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly branchAvailabilityService: BranchAvailabilityService,
    private readonly dailyStockService: DailyStockService
  ) {}

  ngOnInit(): void {
    this.loadBranch();
    this.loadAddresses();
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
    this.checkingAvailability = true;
    this.errorMessage = '';
    
    this.cartService.getActiveCart(branchId).pipe(
      switchMap(cart => {
        this.cartItems = cart.items || [];
        
        if (this.cartItems.length === 0) {
          return of([[], []]);
        }
        
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const todayKey = new Date(now.getTime() - offset).toISOString().slice(0, 10);
        
        return forkJoin([
          this.branchAvailabilityService.getProductAvailabilities(branchId).pipe(
            catchError(() => of([] as BranchProductAvailability[]))
          ),
          this.dailyStockService.getPublicByBranchAndDate(branchId, todayKey).pipe(
            catchError(() => of([] as DailyStock[]))
          )
        ]);
      })
    ).subscribe({
      next: ([availabilities, stocks]: any) => {
        this.branchProductAvailabilities = availabilities as BranchProductAvailability[];
        this.dailyStocks = stocks as DailyStock[];
        
        this.loading = false;
        this.checkingAvailability = false;
        this.calculateTotal();
        this.cartService.syncCart(this.cartItems, branchId);
      },
      error: () => {
        this.cartItems = [];
        this.loading = false;
        this.checkingAvailability = false;
        this.errorMessage = 'Không tải được giỏ hàng. Vui lòng đăng nhập hoặc thử lại.';
        this.calculateTotal();
      }
    });
  }

  loadVouchers(): void {
    const branchId = sessionStorage.getItem('selectedBranchId') || '';
    if (!branchId) {
      this.availableVouchers = [];
      return;
    }

    this.voucherService.getAvailableForCustomer({ branchId, page: 0, size: 3, sort: 'endAt,asc' }).subscribe({
      next: res => {
        this.availableVouchers = res.data?.content || [];
      },
      error: () => {
        this.availableVouchers = [];
      }
    });
  }

  loadBranch(): void {
    const branchId = sessionStorage.getItem('selectedBranchId') || '';
    if (!branchId) return;

    this.branchService.getBranchById(branchId).subscribe({
      next: branch => {
        this.selectedBranch = branch;
        this.calculateTotal();
      },
      error: () => this.selectedBranch = null
    });
  }

  loadAddresses(): void {
    this.addressService.getAddresses().subscribe({
      next: addresses => {
        this.addresses = addresses || [];
        this.selectedAddressId = this.addresses.find(a => a.isDefault)?.id || this.addresses[0]?.id || '';
        this.calculateTotal();
      },
      error: () => this.addresses = []
    });
  }

  onOrderTypeChange(): void {
    sessionStorage.setItem('selectedOrderMode', this.orderType);
    // Keep current payment method if it's MOMO, otherwise use default
    if (this.paymentMethod !== 'MOMO') {
      this.paymentMethod = this.orderType === 'DELIVERY' ? 'COD' : 'CASH';
    }
    this.calculateTotal();
  }

  onAddressChange(): void {
    this.calculateTotal();
  }

  get selectedAddress(): CustomerAddress | null {
    return this.addresses.find(address => address.id === this.selectedAddressId) || null;
  }

  formatAddress(address: CustomerAddress): string {
    return [address.addressLine, address.ward, address.district, address.city]
      .filter(Boolean)
      .join(', ');
  }

  calculateTotal(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    this.shippingFee = this.calculateDeliveryFee();
    this.discount = 0;

    if (this.selectedVoucher) {
      if (this.selectedVoucher.discountType === 'FREE_SHIPPING') {
        this.shippingFee = 0;
      } else if (this.selectedVoucher.discountType === 'PERCENTAGE') {
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

  private calculateDeliveryFee(): number {
    this.deliveryError = '';
    if (this.orderType !== 'DELIVERY') return 0;
    if (this.subtotal >= 200000) return 0;

    const address = this.addresses.find(a => a.id === this.selectedAddressId);
    if (!this.selectedBranch || !address) return 15000;

    const branchLat = this.selectedBranch.latitude;
    const branchLng = this.selectedBranch.longitude;
    if (branchLat == null || branchLng == null || address.latitude == null || address.longitude == null) {
      this.deliveryError = 'Thiếu tọa độ chi nhánh hoặc địa chỉ giao hàng.';
      return 15000;
    }

    const distanceKm = this.haversineKm(branchLat, branchLng, address.latitude, address.longitude) * 1.25;
    if (distanceKm > 15) {
      this.deliveryError = 'Địa chỉ nằm ngoài phạm vi giao hàng 15km.';
    }

    return Math.round(10000 + distanceKm * 5000);
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusKm = 6371;
    const latDistance = this.toRadians(lat2 - lat1);
    const lonDistance = this.toRadians(lon2 - lon1);
    const startLat = this.toRadians(lat1);
    const endLat = this.toRadians(lat2);
    const a = Math.sin(latDistance / 2) ** 2
      + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDistance / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  private toRadians(value: number): number {
    return value * Math.PI / 180;
  }

  updateQuantity(item: CartItem, change: number): void {
    if (change > 0) {
      const stock = this.dailyStocks.find(s => s.variantId === item.variantId);
      if (stock) {
        const currentCartQty = this.cartItems
          .filter(i => i.variantId === item.variantId)
          .reduce((sum, i) => sum + i.quantity, 0);
        if (currentCartQty + change > Number(stock.availableQuantity)) {
          alert('Không đủ số lượng sản phẩm để thêm thêm.');
          return;
        }
      }
    }

    item.quantity += change;
    if (item.quantity < 1) {
      this.removeItem(item);
      return;
    }
    item.totalPrice = (item.unitPrice + item.toppingAmount) * item.quantity;
    this.calculateTotal();
    this.cartService.syncCart(this.cartItems);
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.id).subscribe({
      next: cart => {
        this.cartItems = cart.items || [];
        this.calculateTotal();
      },
      error: err => {
        alert(err?.error?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng. Vui lòng thử lại.');
      }
    });
  }

  applyVoucher(voucher?: VoucherResponse): void {
    if (voucher) {
      const minOrderAmount = voucher.minOrderAmount || 0;
      if (this.subtotal < minOrderAmount) {
        alert(`Đơn hàng tối thiểu ${this.formatPrice(minOrderAmount)} để áp dụng mã này`);
        return;
      }
      this.selectedVoucher = voucher;
      this.voucherCode = voucher.code;
    } else {
      const foundVoucher = this.availableVouchers.find(v => v.code.toUpperCase() === this.voucherCode.trim().toUpperCase());
      if (foundVoucher) {
        const minOrderAmount = foundVoucher.minOrderAmount || 0;
        if (this.subtotal < minOrderAmount) {
          alert(`Đơn hàng tối thiểu ${this.formatPrice(minOrderAmount)} để áp dụng mã này`);
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

  isItemOutOfStock(item: CartItem): boolean {
    if (!item.productId || !item.variantId) return false;

    // Check branch availability
    const branchAvailability = this.branchProductAvailabilities.find(a => a.productId === item.productId);
    if (branchAvailability) {
      if (branchAvailability.status !== 'ACTIVE' || !branchAvailability.available) return true;
      const now = Date.now();
      const from = branchAvailability.availableFrom ? new Date(branchAvailability.availableFrom).getTime() : null;
      const to = branchAvailability.availableTo ? new Date(branchAvailability.availableTo).getTime() : null;
      if ((from && now < from) || (to && now > to)) return true;
    }

    // Check daily stock
    const stock = this.dailyStocks.find(s => s.variantId === item.variantId);
    if (!stock) return true; // If no stock defined for variant, assume out of stock
    return (Number(stock.availableQuantity) || 0) < item.quantity; // Not enough stock for cart quantity
  }

  get hasOutOfStockItems(): boolean {
    return this.cartItems.some(item => this.isItemOutOfStock(item));
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }

    if (this.hasOutOfStockItems) {
      alert('Vui lòng loại bỏ hoặc giảm số lượng sản phẩm đã hết hàng trong giỏ trước khi đặt.');
      return;
    }

    const branchId = sessionStorage.getItem('selectedBranchId') || '';
    if (!branchId) {
      alert('Vui lòng chọn chi nhánh trước khi đặt hàng');
      return;
    }

    if (this.orderType === 'DELIVERY') {
      if (!this.selectedAddressId) {
        alert('Vui lòng chọn địa chỉ giao hàng');
        return;
      }
      if (this.deliveryError) {
        alert(this.deliveryError);
        return;
      }
    }

    const request: CreateOrderRequest = {
      branchId,
      orderType: this.orderType,
      paymentMethod: this.paymentMethod,
      deliveryAddressId: this.orderType === 'DELIVERY' ? this.selectedAddressId : undefined,
      note: this.note?.trim() || undefined,
      voucherCode: this.selectedVoucher?.code || this.voucherCode.trim() || undefined
    };

    this.checkingOut = true;
    this.orderService.createOrder(request).subscribe({
      next: order => {
        // If MOMO payment is selected, redirect to MoMo payment gateway
        if (this.paymentMethod === 'MOMO') {
          this.handleMomoPayment(order.id, order.orderCode);
        } else {
          this.checkingOut = false;
          this.router.navigate(['/track-order', order.id]);
        }
      },
      error: err => {
        this.checkingOut = false;
        alert(err?.error?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      }
    });
  }

  continueShopping(): void {
    this.router.navigate(['/menu']);
  }

  handleMomoPayment(orderId: string, orderCode: string): void {
    const orderInfo = `Thanh toán đơn hàng ${orderCode}`;
    
    this.paymentService.createMomoPayment({
      orderId,
      orderInfo,
      extraData: ''
    }).subscribe({
      next: response => {
        this.checkingOut = false;
        if (response.resultCode === 0 && response.payUrl) {
          // Redirect to MoMo payment page
          window.location.href = response.payUrl;
        } else {
          alert('Không thể tạo thanh toán MoMo. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.');
          this.router.navigate(['/track-order', orderId]);
        }
      },
      error: err => {
        this.checkingOut = false;
        alert(err?.error?.message || 'Không thể kết nối đến MoMo. Vui lòng thử lại sau.');
        this.router.navigate(['/track-order', orderId]);
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  private normalizeOrderMode(value: string | null): 'DELIVERY' | 'PICKUP' {
    return value === 'DELIVERY' ? 'DELIVERY' : 'PICKUP';
  }
}
