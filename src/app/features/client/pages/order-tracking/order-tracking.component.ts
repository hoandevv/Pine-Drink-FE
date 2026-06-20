import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MOCK_ORDERS, MockOrder } from '../../../../shared/mock-data';

interface OrderStatus {
  key: string;
  label: string;
  icon: string;
  completed: boolean;
}

@Component({
  selector: 'app-order-tracking',
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.scss']
})
export class OrderTrackingComponent implements OnInit {
  searchOrderNumber: string = '';
  currentOrder: MockOrder | null = null;
  recentOrders: MockOrder[] = [];
  orderStatuses: OrderStatus[] = [];
  searchError: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Load recent orders (for demo purposes)
    this.recentOrders = MOCK_ORDERS.slice(0, 3);

    // Check if order ID is in route params
    this.route.paramMap.subscribe(params => {
      const orderId = params.get('orderId');
      if (orderId) {
        this.searchByOrderId(orderId);
      }
    });
  }

  searchOrder(): void {
    if (!this.searchOrderNumber.trim()) {
      this.searchError = 'Vui lòng nhập mã đơn hàng';
      return;
    }

    const order = MOCK_ORDERS.find(
      o => o.orderNumber.toLowerCase() === this.searchOrderNumber.trim().toLowerCase()
    );

    if (order) {
      this.currentOrder = order;
      this.searchError = '';
      this.buildOrderStatuses(order);
    } else {
      this.currentOrder = null;
      this.searchError = 'Không tìm thấy đơn hàng với mã này';
    }
  }

  searchByOrderId(orderId: string): void {
    const order = MOCK_ORDERS.find(o => o.id === orderId);
    if (order) {
      this.currentOrder = order;
      this.searchOrderNumber = order.orderNumber;
      this.buildOrderStatuses(order);
    }
  }

  selectRecentOrder(order: MockOrder): void {
    this.currentOrder = order;
    this.searchOrderNumber = order.orderNumber;
    this.searchError = '';
    this.buildOrderStatuses(order);
  }

  buildOrderStatuses(order: MockOrder): void {
    const allStatuses = [
      { key: 'PENDING', label: 'Đã đặt hàng', icon: 'receipt_long' },
      { key: 'CONFIRMED', label: 'Đã xác nhận', icon: 'check_circle' },
      { key: 'PREPARING', label: 'Đang chuẩn bị', icon: 'restaurant' },
      { key: 'READY', label: order.orderType === 'PICKUP' ? 'Sẵn sàng lấy' : 'Đang giao', icon: order.orderType === 'PICKUP' ? 'shopping_bag' : 'local_shipping' },
      { key: 'COMPLETED', label: 'Hoàn thành', icon: 'task_alt' }
    ];

    const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(order.status);

    this.orderStatuses = allStatuses.map((status, index) => ({
      ...status,
      completed: order.status === 'CANCELLED' ? false : index <= currentIndex
    }));

    // Handle cancelled orders
    if (order.status === 'CANCELLED') {
      this.orderStatuses = [
        { key: 'PENDING', label: 'Đã đặt hàng', icon: 'receipt_long', completed: true },
        { key: 'CANCELLED', label: 'Đã hủy', icon: 'cancel', completed: true }
      ];
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  formatDate(dateString: string): string {
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
      'PENDING': '#f59e0b',
      'CONFIRMED': '#3b82f6',
      'PREPARING': '#8b5cf6',
      'READY': '#10b981',
      'COMPLETED': '#22c55e',
      'CANCELLED': '#ef4444'
    };
    return colors[status] || '#69725F';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Chờ xác nhận',
      'CONFIRMED': 'Đã xác nhận',
      'PREPARING': 'Đang chuẩn bị',
      'READY': 'Sẵn sàng',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy'
    };
    return labels[status] || status;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      'CASH': 'Tiền mặt',
      'CARD': 'Thẻ ngân hàng',
      'MOMO': 'Ví MoMo',
      'ZALOPAY': 'Ví ZaloPay'
    };
    return labels[method] || method;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Chờ thanh toán',
      'PAID': 'Đã thanh toán',
      'FAILED': 'Thanh toán thất bại'
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
