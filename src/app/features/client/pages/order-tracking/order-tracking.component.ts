import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, finalize, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Order, OrderItem } from '../../../orders/models/order.model';
import { OrderService } from '../../../orders/services/order.service';
import { OrderRealtimeEnvelope, OrderRealtimeService } from '../../../orders/services/order-realtime.service';
import { AuthService } from '../../../../core/services/auth.service';

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
export class OrderTrackingComponent implements OnInit, OnDestroy {
  searchOrderNumber = '';
  currentOrder: TrackingOrder | null = null;
  recentOrders: TrackingOrder[] = [];
  orderStatuses: OrderStatusStep[] = [];
  searchError = '';
  loading = false;
  realtimeNotice = '';
  expiryCountdownText = '';
  expiryProgress = 0;
  infoExpanded = false;
  private readonly orderExpireMinutes = 15;
  private countdownTimerId?: ReturnType<typeof setInterval>;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService,
    private readonly orderRealtimeService: OrderRealtimeService,
    private readonly authService: AuthService
  ) { }

  ngOnInit(): void {
    if (!this.isLoggedIn) {
      return;
    }

    this.loadRecentOrders();
    this.listenOrderRealtime();

    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        const orderId = params.get('orderId');
        if (orderId) {
          this.searchByOrderId(orderId);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.stopExpiryCountdown();
    this.subscriptions.unsubscribe();
    if (this.currentOrder?.id) {
      this.orderRealtimeService.unsubscribeOrder(this.currentOrder.id);
    }
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  toggleInfoExpanded(): void {
    this.infoExpanded = !this.infoExpanded;
  }

  loadRecentOrders(): void {
    if (!this.isLoggedIn) {
      this.recentOrders = [];
      return;
    }

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
    if (!this.isLoggedIn) {
      this.searchError = 'Vui lòng đăng nhập để xem đơn hàng';
      return;
    }

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
    if (!this.isLoggedIn) {
      this.searchError = 'Vui lòng đăng nhập để xem đơn hàng';
      return;
    }

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
    const previousOrderId = this.currentOrder?.id;
    const trackingOrder = this.toTrackingOrder(order);
    this.currentOrder = trackingOrder;
    this.searchOrderNumber = trackingOrder.orderNumber;
    this.searchError = '';
    this.realtimeNotice = '';
    this.infoExpanded = false;
    this.buildOrderStatuses(trackingOrder);
    this.subscribeCurrentOrder(previousOrderId);
    this.startExpiryCountdown();
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
        {
          key: order.status,
          label: order.status === 'CANCELLED' ? 'Đã hủy' : 'Tự động từ chối',
          icon: order.status === 'CANCELLED' ? 'cancel' : 'timer_off',
          completed: true
        }
      ];
    }
  }

  getRejectionReason(order: TrackingOrder): string {
    return order.rejectReason || order.expiryReason || order.cancelReason || order.note || 'Đơn hàng quá thời gian xác nhận nên hệ thống đã tự động từ chối và hoàn lại tồn kho.';
  }

  getExpiryTime(order: TrackingOrder): Date | null {
    const source = order.expiresAt || order.createdAt;
    if (!source) {
      return null;
    }

    const baseTime = new Date(source).getTime();
    if (Number.isNaN(baseTime)) {
      return null;
    }

    return order.expiresAt
      ? new Date(baseTime)
      : new Date(baseTime + this.orderExpireMinutes * 60 * 1000);
  }

  private startExpiryCountdown(): void {
    this.stopExpiryCountdown();
    this.updateExpiryCountdown();

    if (this.currentOrder?.status === 'PENDING') {
      this.countdownTimerId = setInterval(() => this.updateExpiryCountdown(), 1000);
    }
  }

  private stopExpiryCountdown(): void {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = undefined;
    }
  }

  private updateExpiryCountdown(): void {
    if (!this.currentOrder || this.currentOrder.status !== 'PENDING') {
      this.expiryCountdownText = '';
      this.expiryProgress = 0;
      this.stopExpiryCountdown();
      return;
    }

    const expiresAt = this.getExpiryTime(this.currentOrder);
    if (!expiresAt) {
      this.expiryCountdownText = '';
      this.expiryProgress = 0;
      return;
    }

    const now = Date.now();
    const remainingMs = Math.max(0, expiresAt.getTime() - now);
    const totalMs = this.orderExpireMinutes * 60 * 1000;
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);

    this.expiryCountdownText = remainingMs > 0
      ? `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : '00:00';
    this.expiryProgress = Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100));
  }

  private listenOrderRealtime(): void {
    this.subscriptions.add(
      this.orderRealtimeService.orderEvents$.subscribe(event => this.applyRealtimeEvent(event))
    );

    this.subscriptions.add(
      this.orderRealtimeService.errors$.subscribe(error => console.warn('[Order realtime]', error))
    );

    this.orderRealtimeService.connect();
  }

  private subscribeCurrentOrder(previousOrderId?: string): void {
    const currentOrderId = this.currentOrder?.id;
    if (!currentOrderId) {
      return;
    }

    if (previousOrderId && previousOrderId !== currentOrderId) {
      this.orderRealtimeService.unsubscribeOrder(previousOrderId);
    }

    this.orderRealtimeService.subscribeOrder(currentOrderId);
  }

  private applyRealtimeEvent(event: OrderRealtimeEnvelope): void {
    const incoming = (event.payload || event.data || {}) as Partial<Order> & { newStatus?: Order['status']; reason?: string };
    const incomingId = incoming.id || event.orderId || event.targetId;
    if (!this.currentOrder || incomingId !== this.currentOrder.id) {
      return;
    }

    this.orderService.getOrderById(incomingId).pipe(
      catchError(error => {
        console.warn('[Order realtime] hydrate failed', error);
        return of({
          ...this.currentOrder!,
          ...incoming,
          status: incoming.status ?? incoming.newStatus ?? this.currentOrder!.status,
          rejectReason: incoming.reason ?? this.currentOrder!.rejectReason,
          cancelReason: incoming.reason ?? this.currentOrder!.cancelReason
        } as Order);
      })
    ).subscribe(order => this.updateCurrentOrderFromRealtime(order));
  }

  private updateCurrentOrderFromRealtime(order: Order): void {
    if (!this.currentOrder || order.id !== this.currentOrder.id) {
      return;
    }

    const previousStatus = this.currentOrder.status;
    const merged = this.toTrackingOrder({ ...this.currentOrder, ...order } as Order);
    this.currentOrder = merged;
    this.buildOrderStatuses(merged);

    if (merged.status === 'REJECTED') {
      this.realtimeNotice = 'Đơn hàng đã quá hạn xác nhận và vừa được hệ thống tự động từ chối.';
    } else if (merged.status === 'CANCELLED') {
      this.realtimeNotice = 'Đơn hàng vừa được hủy.';
    } else if (merged.status !== previousStatus) {
      this.realtimeNotice = `Trạng thái đơn hàng vừa cập nhật: ${this.getStatusLabel(merged.status)}.`;
    }

    this.startExpiryCountdown();

    const existsInRecent = this.recentOrders.some(recentOrder => recentOrder.id === merged.id);
    this.recentOrders = existsInRecent
      ? this.recentOrders.map(recentOrder => recentOrder.id === merged.id ? merged : recentOrder)
      : [merged, ...this.recentOrders].slice(0, 3);
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

  formatDate(dateString?: string | Date): string {
    if (!dateString) return 'Chưa cập nhật';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
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
      PREPARING: '#f97316',
      READY: '#a855f7',
      DELIVERING: '#06b6d4',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
      REJECTED: '#ec4899'
    };
    return colors[status] || '#69725F';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      PENDING: 'Đã đặt hàng',
      CONFIRMED: 'Đã xác nhận',
      PREPARING: 'Đang chuẩn bị',
      READY: 'Sẵn sàng',
      DELIVERING: 'Đang giao',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
      REJECTED: 'Tự động từ chối'
    };
    return labels[status] || status;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      CASH: 'Tiền mặt',
      COD: 'Thanh toán khi nhận hàng'
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
    if (this.currentOrder?.id) {
      this.orderRealtimeService.unsubscribeOrder(this.currentOrder.id);
    }
    this.searchOrderNumber = '';
    this.currentOrder = null;
    this.searchError = '';
    this.realtimeNotice = '';
    this.expiryCountdownText = '';
    this.expiryProgress = 0;
    this.infoExpanded = false;
    this.stopExpiryCountdown();
    this.orderStatuses = [];
  }
}
