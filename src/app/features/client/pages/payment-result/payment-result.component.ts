import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastService } from '../../../../core/services/toast.service';
import { PaymentService } from '../../../orders/services/payment.service';

@Component({
  selector: 'app-payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.scss']
})
export class PaymentResultComponent implements OnInit {
  resultCode: number = -1;
  orderId: string = '';
  orderCode: string = '';
  amount: number = 0;
  message: string = '';
  transId: string = '';
  paymentMethod: string = '';
  loading: boolean = true;
  retryingPayment: boolean = false;

  private momoOrderId: string = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly paymentService: PaymentService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // Debug: Log all params from MoMo
      console.log('MoMo Return Params:', params);
      console.log('resultCode value:', params['resultCode'], 'type:', typeof params['resultCode']);
      
      // Fix: Don't use || because 0 is falsy! Use ?? or explicit check
      this.resultCode = params['resultCode'] != null ? Number(params['resultCode']) : -1;
      this.momoOrderId = params['orderId'] || '';
      this.orderId = this.extractOriginalOrderId(this.momoOrderId);
      this.amount = Number(params['amount']) || 0;
      this.message = params['message'] || '';
      this.transId = params['transId'] || '';
      this.paymentMethod = params['payType'] || 'MOMO';
      
      console.log('Parsed resultCode:', this.resultCode);
      console.log('Is Success?', this.isSuccess);
      
      this.orderCode = this.orderId || this.momoOrderId;

      this.loading = false;
    });
  }

  get isSuccess(): boolean {
    return this.resultCode === 0;
  }

  get canRetryPayment(): boolean {
    return !this.isSuccess && !!this.orderId && this.paymentMethod.toUpperCase().includes('MOMO');
  }

  get statusIcon(): string {
    return this.isSuccess ? '✓' : '✕';
  }

  get statusTitle(): string {
    return this.isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại';
  }

  get statusMessage(): string {
    if (this.isSuccess) {
      return 'Thanh toán MoMo thành công. Đơn hàng đang chờ cửa hàng xác nhận trước khi xử lý.';
    }
    return this.message || 'Thanh toán không thành công. Bạn có thể thanh toán lại cho đơn hàng này.';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  retryMomoPayment(): void {
    if (!this.canRetryPayment || this.retryingPayment) {
      return;
    }

    this.retryingPayment = true;
    this.paymentService.createMomoPayment({
      orderId: this.orderId,
      orderInfo: `Pay Pine Drink order ${this.orderId}`
    }).subscribe({
      next: (response) => {
        if (response?.payUrl) {
          window.location.href = response.payUrl;
          return;
        }
        this.toastService.error(response?.message || 'Không lấy được link thanh toán MoMo.');
        this.retryingPayment = false;
      },
      error: (error) => {
        console.error('Retry MoMo payment failed', error);
        this.toastService.error('Không thể tạo lại thanh toán MoMo. Vui lòng thử lại.');
        this.retryingPayment = false;
      }
    });
  }

  goToOrderTracking(): void {
    if (this.orderCode) {
      this.router.navigate(['/track-order', this.orderCode]);
    } else {
      this.router.navigate(['/track-order']);
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToMenu(): void {
    this.router.navigate(['/menu']);
  }

  private extractOriginalOrderId(momoOrderId: string): string {
    const parts = momoOrderId.split('-');
    return parts.length > 1 ? parts.slice(0, -1).join('-') : momoOrderId;
  }
}
