import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { Order, OrderItem } from '../../../orders/models/order.model';
import { OrderService } from '../../../orders/services/order.service';

interface OrderStatusStep {
  key: string;
  label: string;
  icon: string;
  completed: boolean;
}

type TrackingOrder = Order & {
  orderNumber: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  estimatedTime?: string;
  voucherCode?: string;
};

@Component({
  selector: 'app-order-tracking',
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.scss']
})
export class OrderTrackingComponent implements OnInit {
  searchOrderNumber = '';
  currentOrder: TrackingOrder | null = null;
  recentOrders: TrackingOrder[] = [];
  orderStatuses: OrderStatusStep[] = [];
  searchError = '';
  loading = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadRecentOrders();

    this.route.paramMap.subscribe(params => {
      const orderId = params.get('orderId');
      if (orderId) {
        this.searchByOrderId(orderId);
      }
    });
  }

  loadRecentOrders(): void {
    this.orderService.getMyOrders(0, 3).subscribe({
      next: page => {
        this.recentOrders = (page?.content || []).map(order => this.toTrackingOrder(order));
      },
      error: () => {
        this.recentOrders = [];
      }
    });
  }

  searchOrder(): void {
    const keyword = this.searchOrderNumber.trim();
    if (!keyword) {
      this.searchError = 'Vui lòng nhập mã đơn hàng';
      return;
    }

    this.loading = true;
    this.orderService.getOrderByCode(keyword)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: order => this.setCurrentOrder(order),
        error: () => {
          this.currentOrder = null;
          this.orderStatuses = [];
          this.searchError = 'Không tìm thấy đơn hàng với mã này';
        }
      });
  }

  searchByOrderId(orderId: string): void {
    this.loading = true;
    this.orderService.getOrderById(orderId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: order => this.setCurrentOrder(order),
        error: () => {
          this.currentOrder = null;
          this.orderStatuses = [];
          this.searchError = 'Không tìm thấy đơn hàng';
        }
      });
  }

  selectRecentOrder(order: TrackingOrder): void {
    this.setCurrentOrder(order);
  }

  private setCurrentOrder(order: Order): void {
    const trackingOrder = this.toTrackingOrder(order);
    this.currentOrder = trackingOrder;
    this.searchOrderNumber = trackingOrder.orderNumber;
    this.searchError = '';
    this.buildOrderStatuses(trackingOrder);
  }

  private toTrackingOrder(order: Order): TrackingOrder {
    return {
      ...order,
      orderNumber: order.orderCode,
      orderType: order.orderType || order.type || 'PICKUP',
      subtotal: order.subtotalAmount ?? order.subtotal ?? 0,
      discount: order.discountAmount ?? order.discount ?? 0,
      shippingFee: order.deliveryFee ?? 0,
      total: order.totalAmount ?? 0,
      items: order.items || []
    };
  }

  buildOrderStatuses(order: TrackingOrder): void {
    const allStatuses = [
      { key: 'PENDING', label: 'Đã đặt hàng', icon: 'receipt_long' },
      { key: 'CONFIRMED', label: 'Đã xác nhận', icon: 'check_circle' },
      { key: 'PREPARING', label: 'Đang chuẩn bị', icon: 'restaurant' },
      { key: 'READY', label: order.orderType === 'PICKUP' ? 'Sẵn sàng lấy' : 'Sẵn sàng giao', icon: order.orderType === 'PICKUP' ? 'shopping_bag' : 'inventory_2' },
      { key: 'DELIVERING', label: 'Đang giao', icon: 'local_shipping' },
      { key: 'COMPLETED', label: 'Hoàn thành', icon: 'task_alt' }
    ];

    const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(order.status);

    this.orderStatuses = allStatuses
      .filter(status => order.orderType === 'DELIVERY' || status.key !== 'DELIVERING')
      .map(status => ({
        ...status,
        completed: order.status === 'CANCELLED' || order.status === 'REJECTED' ? false : statusOrder.indexOf(status.key) <= currentIndex
      }));

    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      this.orderStatuses = [
        { key: 'PENDING', label: 'Đã đặt hàng', icon: 'receipt_long', completed: true },
        { key: order.status, label: order.status === 'CANCELLED' ? 'Đã hủy' : 'Đã từ chối', icon: 'cancel', completed: true }
      ];
    }
  }

  getItemName(item: OrderItem): string {
    return item.productName || item.name || 'Sản phẩm';
  }

  getItemImageStyle(item: OrderItem): string {
    const imageUrl = item.productImageUrl || item.imageUrl || item.image || item.productImage;
    return imageUrl
      ? `url(${imageUrl}) center/cover no-repeat`
      : 'linear-gradient(135deg, #fff8e7 0%, #e8f5df 100%)';
  }

  getItemSize(item: OrderItem): string {
    return item.variantName || item.variant || item.size || 'Mặc định';
  }

  getItemToppings(item: OrderItem): string {
    return (item.toppings || []).map(topping => topping.toppingName || topping.name).filter(Boolean).join(', ');
  }

  getItemLineTotal(item: OrderItem): number {
    return item.totalPrice ?? ((item.unitPrice ?? item.price ?? 0) * item.quantity);
  }

  formatPrice(price: number | undefined): string {
    return new Intl.NumberFormat('vi-VN').format(price || 0) + 'đ';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      PENDING: '#f59e0b',
      CONFIRMED: '#3b82f6',
      PREPARING: '#8b5cf6',
      READY: '#10b981',
      DELIVERING: '#06b6d4',
      COMPLETED: '#22c55e',
      CANCELLED: '#ef4444',
      REJECTED: '#ef4444'
    };
    return colors[status] || '#69725F';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PREPARING: 'Đang chuẩn bị',
      READY: 'Sẵn sàng',
      DELIVERING: 'Đang giao',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
      REJECTED: 'Đã từ chối'
    };
    return labels[status] || status;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      CASH: 'Tiền mặt',
      COD: 'Thanh toán khi nhận hàng',
      VNPAY: 'VNPay',
      MOMO: 'Ví MoMo',
      BANK_TRANSFER: 'Chuyển khoản'
    };
    return labels[method] || method;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      UNPAID: 'Chưa thanh toán',
      PENDING: 'Chờ thanh toán',
      PAID: 'Đã thanh toán',
      FAILED: 'Thanh toán thất bại',
      REFUNDED: 'Đã hoàn tiền'
    };
    return labels[status] || status;
  }

  clearSearch(): void {
    this.searchOrderNumber = '';
    this.currentOrder = null;
    this.searchError = '';
    this.orderStatuses = [];
  }
}
