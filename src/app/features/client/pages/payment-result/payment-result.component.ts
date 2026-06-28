import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // Debug: Log all params from MoMo
      console.log('MoMo Return Params:', params);
      console.log('resultCode value:', params['resultCode'], 'type:', typeof params['resultCode']);
      
      // Fix: Don't use || because 0 is falsy! Use ?? or explicit check
      this.resultCode = params['resultCode'] != null ? Number(params['resultCode']) : -1;
      this.orderId = params['orderId'] || '';
      this.amount = Number(params['amount']) || 0;
      this.message = params['message'] || '';
      this.transId = params['transId'] || '';
      this.paymentMethod = params['payType'] || 'MOMO';
      
      console.log('Parsed resultCode:', this.resultCode);
      console.log('Is Success?', this.isSuccess);
      
      // Extract order code from orderId (format: order-uuid-timestamp)
      if (this.orderId) {
        const parts = this.orderId.split('-');
        if (parts.length >= 2) {
          this.orderCode = parts.slice(0, -1).join('-');
        } else {
          this.orderCode = this.orderId;
        }
      }

      this.loading = false;
    });
  }

  get isSuccess(): boolean {
    return this.resultCode === 0;
  }

  get statusIcon(): string {
    return this.isSuccess ? '✓' : '✕';
  }

  get statusTitle(): string {
    return this.isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại';
  }

  get statusMessage(): string {
    if (this.isSuccess) {
      return 'Đơn hàng của bạn đã được thanh toán thành công. Chúng tôi đang xử lý đơn hàng.';
    }
    return this.message || 'Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
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
}
