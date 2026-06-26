import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, finalize, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { Order, OrderStatus } from '../../models/order.model';
import { OrderRealtimeEnvelope, OrderRealtimeService } from '../../services/order-realtime.service';
import { OrderService } from '../../services/order.service';
import { PaymentService, RecordOfflinePaymentRequest } from '../../services/payment.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
  // We can write the custom CSS directly in order-list.component.scss
})
export class OrderListComponent implements OnInit, OnDestroy {
  viewMode: 'table' | 'kanban' = 'table'; // Kept for compatibility, though we don't use it anymore
  isDrawerOpen = false; // Kept for compatibility
  isLoading = false;
  selectedOrder: Order | null = null;
  activeTab: OrderStatus | 'ALL' = 'ALL';
  showTimelineDrawer = false;
  searchQuery = '';
  recordingPaymentOrderId: string | null = null;

  private readonly subscriptions = new Subscription();
  private readonly subscribedBranchIds = new Set<string>();
  private readonly STORAGE_KEY = 'pine_drink_read_orders';
  
  readOrderIds = new Set<string>();
  stats: any[] = []; // Replaced by simpler stats representation if needed
  orders: Order[] = [];
  allOrders: Order[] = [];
  pageData: PageResponse<Order> = {
    content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true
  };

  readonly tabs: { label: string; value: OrderStatus | 'ALL'; count: number }[] = [
    { label: 'All', value: 'ALL', count: 0 },
    { label: 'Pending', value: 'PENDING', count: 0 },
    { label: 'Confirmed', value: 'CONFIRMED', count: 0 },
    { label: 'Preparing', value: 'PREPARING', count: 0 },
    { label: 'Ready', value: 'READY', count: 0 },
    { label: 'Delivering', value: 'DELIVERING', count: 0 },
    { label: 'Completed', value: 'COMPLETED', count: 0 },
    { label: 'Cancelled', value: 'CANCELLED', count: 0 },
    { label: 'Rejected', value: 'REJECTED', count: 0 }
  ];

  constructor(
    private readonly orderService: OrderService,
    private readonly orderRealtimeService: OrderRealtimeService,
    private readonly paymentService: PaymentService,
    private readonly toastService: ToastService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReadOrders();
    this.listenOrderRealtime();
    this.subscribeStaffBranches();
    this.refreshData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.subscribedBranchIds.forEach(branchId => this.orderRealtimeService.unsubscribeBranchOrders(branchId));
    this.subscribedBranchIds.clear();
  }

  loadReadOrders(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.readOrderIds = new Set<string>(JSON.parse(data));
      }
    } catch (e) {
      console.error('Error loading read orders', e);
    }
  }

  saveReadOrders(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.readOrderIds)));
    } catch (e) {
      console.error('Error saving read orders', e);
    }
  }

  markAsRead(orderId: string): void {
    if (!this.readOrderIds.has(orderId)) {
      this.readOrderIds.add(orderId);
      this.saveReadOrders();
    }
  }

  refreshData(): void {
    this.isLoading = true;
    // Fetch all orders (page 0, size 200) to filter locally and keep counts accurate
    this.orderService.getOrders(0, 200, 'ALL').subscribe({
      next: (response) => {
        this.pageData = response;
        this.allOrders = (response.content ?? [])
          .map(o => this.normalizeOrder(o))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Initialize readOrderIds on first load so old orders aren't all highlighted
        if (this.readOrderIds.size === 0 && this.allOrders.length) {
          this.allOrders.forEach(o => this.readOrderIds.add(o.id));
          this.saveReadOrders();
        }

        this.applyLocalFilters();
        this.subscribeLoadedBranches();
        this.updateStats();
        this.updateTabCounts();

        // Keep selectedOrder in sync with refreshed data
        if (this.selectedOrder) {
          const fresh = this.allOrders.find(o => o.id === this.selectedOrder!.id);
          if (fresh) {
            this.selectedOrder = fresh;
          }
        }
      },
      error: (error) => {
        console.error('Load orders failed', error);
        this.orders = [];
        this.allOrders = [];
        this.toastService.error('Failed to load orders');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  toggleView(mode: 'table' | 'kanban'): void {
    this.viewMode = mode;
  }

  onTabChange(tab: OrderStatus | 'ALL'): void {
    this.activeTab = tab;
    this.applyLocalFilters();
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyLocalFilters();
  }

  onFilterChange(filters: any): void {
    this.searchQuery = (filters?.keyword ?? filters?.search ?? '').toString();
    this.applyLocalFilters();
  }

  applyLocalFilters(): void {
    let filtered = this.allOrders;

    // 1. Filter by status tab
    if (this.activeTab !== 'ALL') {
      filtered = filtered.filter(o => o.status === this.activeTab);
    }

    // 2. Filter by search keyword
    const keyword = this.searchQuery.trim().toLowerCase();
    if (keyword) {
      filtered = filtered.filter(o =>
        [o.orderCode, o.customerName, o.customerPhone, o.branchName]
          .filter(Boolean)
          .some(val => val!.toLowerCase().includes(keyword))
      );
    }

    this.orders = filtered;
  }

  openDetail(order: Order): void {
    this.markAsRead(order.id);
    this.orderService.getOrderById(order.id).subscribe({
      next: (detail) => {
        this.selectedOrder = this.normalizeOrder(detail);
        this.isDrawerOpen = true;
      },
      error: () => {
        this.selectedOrder = order;
        this.isDrawerOpen = true;
      }
    });
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  clearSelection(): void {
    this.selectedOrder = null;
    this.showTimelineDrawer = false;
  }

  toggleTimelineDrawer(): void {
    this.showTimelineDrawer = !this.showTimelineDrawer;
  }

  onStatusChange({ order, status }: { order: Order; status: OrderStatus }): void {
    // Used by status transitions. We call updateOrderStatusWithReason
    this.updateOrderStatusWithReason(order, status);
  }

  updateOrderStatusWithReason(order: Order, status: OrderStatus, reason?: string): void {
    this.orderService.updateOrderStatus(order.id, status, reason).subscribe({
      next: (updatedOrder) => {
        const normalized = this.normalizeOrder(updatedOrder);
        this.allOrders = this.allOrders.map(o => o.id === order.id ? normalized : o);
        this.orders = this.orders.map(o => o.id === order.id ? normalized : o);
        if (this.selectedOrder?.id === order.id) {
          this.selectedOrder = normalized;
        }
        this.updateStats();
        this.updateTabCounts();
        this.toastService.success(`Order status updated to ${status}`);
      },
      error: (error) => {
        console.error('Update order status failed', error);
        this.toastService.error('Failed to update order status');
      }
    });
  }

  handlePrimaryAction(order: Order): void {
    const nextStatus = this.getNextStatus(order);
    if (nextStatus) {
      this.updateOrderStatusWithReason(order, nextStatus);
    }
  }

  handleSecondaryAction(order: Order): void {
    if (order.status === 'PENDING') {
      const reason = window.prompt('Enter rejection reason:');
      if (reason !== null) {
        this.updateOrderStatusWithReason(order, 'REJECTED', reason.trim());
      }
    } else if (['CONFIRMED', 'PREPARING', 'READY'].includes(order.status)) {
      const reason = window.prompt('Enter cancellation reason:');
      if (reason !== null) {
        this.updateOrderStatusWithReason(order, 'CANCELLED', reason.trim());
      }
    } else if (order.status === 'COMPLETED') {
      this.printReceipt(order);
    }
  }

  confirmCounterPayment(order: Order, method: 'CASH' | 'COD'): void {
    if (this.recordingPaymentOrderId) {
      return;
    }

    const request: RecordOfflinePaymentRequest = {
      orderId: order.id,
      paymentMethod: method
    };

    this.recordingPaymentOrderId = order.id;
    this.paymentService.recordOfflinePayment(request).pipe(
      switchMap(() => this.orderService.getOrderById(order.id)),
      finalize(() => {
        this.recordingPaymentOrderId = null;
      })
    ).subscribe({
      next: (updatedOrder) => {
        const normalized = this.normalizeOrder(updatedOrder);
        const paidAt = new Date().toISOString();

        normalized.timeline = [
          {
            status: 'PAID',
            time: paidAt,
            note: `Đã thu tiền tại quầy (${method})`
          },
          ...(normalized.timeline ?? [])
        ];

        this.allOrders = this.allOrders.map(o => o.id === order.id ? normalized : o);
        this.orders = this.orders.map(o => o.id === order.id ? normalized : o);
        this.selectedOrder = normalized;

        this.toastService.success(`Đã xác nhận thanh toán ${Number(normalized.totalAmount || 0).toLocaleString()} đ qua ${method}`);
      },
      error: (error) => {
        console.error('Record offline payment failed', error);
        this.toastService.error(error?.error?.message || 'Không thể xác nhận thanh toán');
      }
    });
  }

  getStagesForOrder(order: Order): { label: string; value: OrderStatus }[] {
    const isDelivery = order.type === 'DELIVERY';
    if (isDelivery) {
      return [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Preparing', value: 'PREPARING' },
        { label: 'Ready', value: 'READY' },
        { label: 'Delivering', value: 'DELIVERING' },
        { label: 'Completed', value: 'COMPLETED' }
      ];
    } else {
      return [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Preparing', value: 'PREPARING' },
        { label: 'Ready', value: 'READY' },
        { label: 'Completed', value: 'COMPLETED' }
      ];
    }
  }

  isStepCompleted(order: Order, stepValue: OrderStatus): boolean {
    const stages = this.getStagesForOrder(order).map(s => s.value);
    const currentIndex = stages.indexOf(order.status);
    const stepIndex = stages.indexOf(stepValue);
    if (currentIndex === -1 || stepIndex === -1) return false;
    return stepIndex <= currentIndex;
  }

  getStageProgressPercent(order: Order): number {
    const stages = this.getStagesForOrder(order);
    const currentIndex = stages.findIndex(s => s.value === order.status);
    if (currentIndex === -1) return 0;
    if (currentIndex === stages.length - 1) return 100;
    return (currentIndex / (stages.length - 1)) * 100;
  }

  getPrimaryActionLabel(order: Order): string {
    switch (order.status) {
      case 'PENDING':
        return 'Confirm order';
      case 'CONFIRMED':
        return 'Start preparing';
      case 'PREPARING':
        return 'Mark ready';
      case 'READY':
        return order.type === 'DELIVERY' ? 'Start delivering' : 'Complete order';
      case 'DELIVERING':
        return 'Mark completed';
      default:
        return '';
    }
  }

  getNextStatus(order: Order): OrderStatus | null {
    switch (order.status) {
      case 'PENDING':
        return 'CONFIRMED';
      case 'CONFIRMED':
        return 'PREPARING';
      case 'PREPARING':
        return 'READY';
      case 'READY':
        return order.type === 'DELIVERY' ? 'DELIVERING' : 'COMPLETED';
      case 'DELIVERING':
        return 'COMPLETED';
      default:
        return null;
    }
  }

  getTypeIcon(type?: string): string {
    switch (type) {
      case 'DELIVERY': return 'moped';
      case 'PICKUP': return 'shopping_bag';
      case 'WALK_IN': return 'table_restaurant';
      default: return 'help';
    }
  }

  getItemsBrief(order: Order): string {
    if (!order.items || order.items.length === 0) return 'No items';
    const firstItem = order.items[0];
    const restCount = order.items.length - 1;
    let brief = `${firstItem.name} x${firstItem.quantity}`;
    if (restCount > 0) {
      brief += ` and ${restCount} other item${restCount > 1 ? 's' : ''}`;
    }
    return brief;
  }

  getTableNumber(order: Order): string {
    if (!order.note) return 'Counter';
    const match = order.note.match(/(?:table|bàn)\s*#?(\d+)/i);
    return match ? match[1] : 'Counter';
  }

  getRelativeTime(createdAt: string): string {
    if (!createdAt) return '';
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(createdAt).toLocaleDateString();
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.success('Order code copied to clipboard');
    }).catch(() => {
      this.toastService.error('Failed to copy');
    });
  }

  printReceipt(order: Order): void {
    const printContent = this.generateReceiptHtml(order);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(win.document.title = `Receipt_${order.orderCode}`);
      win.document.body.innerHTML = printContent;
      win.document.close();
      win.print();
    } else {
      this.toastService.error('Failed to open print window');
    }
  }

  generateReceiptHtml(order: Order): string {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.name} x${item.quantity}</td>
        <td style="text-align: right;">${item.totalPrice.toLocaleString()} đ</td>
      </tr>
      ${item.toppings.length ? `
        <tr>
          <td colspan="2" style="font-size: 11px; color: #666; padding-left: 10px;">
            + ${item.toppings.map(t => t.name || t.toppingName).join(', ')}
          </td>
        </tr>
      ` : ''}
    `).join('');

    return `
      <html>
      <head>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 4px 0; vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="center">
          <h3>PINE DRINK</h3>
          <p>${order.branchName || 'Branch Store'}</p>
          <p>Order ID: ${order.orderCode}</p>
          <p>${order.createdAt}</p>
        </div>
        <div class="divider"></div>
        <p><span class="bold">Customer:</span> ${order.customerName || 'Walk-in'}</p>
        <p><span class="bold">Type:</span> ${order.type}</p>
        <div class="divider"></div>
        <table>
          ${itemsHtml}
        </table>
        <div class="divider"></div>
        <table>
          <tr><td>Subtotal:</td><td style="text-align: right;">${(order.subtotal || 0).toLocaleString()} đ</td></tr>
          <tr><td>Discount:</td><td style="text-align: right;">-${(order.discount || 0).toLocaleString()} đ</td></tr>
          ${order.deliveryFee ? `<tr><td>Delivery Fee:</td><td style="text-align: right;">${(order.deliveryFee || 0).toLocaleString()} đ</td></tr>` : ''}
          <tr class="bold"><td>Total:</td><td style="text-align: right;">${(order.totalAmount || 0).toLocaleString()} đ</td></tr>
        </table>
        <div class="divider"></div>
        <div class="center">
          <p>Payment: ${order.paymentMethod} (${order.paymentStatus})</p>
          <p>Thank you for choosing Pine Drink!</p>
        </div>
      </body>
      </html>
    `;
  }

  private listenOrderRealtime(): void {
    this.subscriptions.add(
      this.orderRealtimeService.orderEvents$.subscribe(event => this.applyRealtimeEvent(event))
    );

    this.subscriptions.add(
      this.orderRealtimeService.errors$.subscribe(error => console.warn('[Order realtime]', error))
    );

    this.subscriptions.add(
      this.authService.currentUser$.subscribe(() => this.subscribeStaffBranches())
    );

    this.orderRealtimeService.connect();
  }

  private subscribeLoadedBranches(): void {
    this.allOrders
      .map(order => order.branchId)
      .filter((branchId): branchId is string => !!branchId)
      .forEach(branchId => this.subscribeBranchTopic(branchId));
  }

  private subscribeStaffBranches(): void {
    const branchIds = this.authService.getCurrentUser()?.scope?.branchIds ?? [];
    branchIds.forEach(branchId => this.subscribeBranchTopic(branchId));
  }

  private subscribeBranchTopic(branchId: string): void {
    if (this.subscribedBranchIds.has(branchId)) {
      return;
    }

    this.subscribedBranchIds.add(branchId);
    this.orderRealtimeService.subscribeBranchOrders(branchId);
  }

  private applyRealtimeEvent(event: OrderRealtimeEnvelope): void {
    const incoming = (event.payload || event.data || {}) as Partial<Order>;
    const incomingId = incoming.id || event.orderId || event.targetId;
    if (!incomingId) {
      return;
    }

    this.orderService.getOrderById(incomingId).pipe(
      catchError(error => {
        console.warn('[Order realtime] hydrate failed', error);
        return of({ ...incoming, id: incomingId } as Order);
      })
    ).subscribe(order => this.upsertRealtimeOrder(event, order));
  }

  private upsertRealtimeOrder(event: OrderRealtimeEnvelope, incomingOrder: Order): void {
    const incomingId = incomingOrder.id || event.orderId || event.targetId;
    if (!incomingId) {
      return;
    }

    const eventType = event.type || event.eventType;
    const existing = this.allOrders.find(order => order.id === incomingId);
    const normalized = this.normalizeOrder({ ...(existing ?? {}), ...incomingOrder } as Order);

    this.allOrders = [normalized, ...this.allOrders.filter(order => order.id !== incomingId)];

    if (this.selectedOrder?.id === incomingId) {
      this.selectedOrder = normalized;
    }

    if (!existing && eventType === 'ORDER_CREATED') {
      this.toastService.success(`Đơn mới ${normalized.orderCode || ''}`.trim());
    }

    if (normalized.branchId) {
      this.subscribeBranchTopic(normalized.branchId);
    }

    this.applyLocalFilters();
    this.updateStats();
    this.updateTabCounts();
  }

  private updateStats(): void {
    // Maintained for backward compatibility structure
    const pending = this.allOrders.filter(o => o.status === 'PENDING').length;
    const preparing = this.allOrders.filter(o => o.status === 'PREPARING').length;
    const revenue = this.allOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    this.stats = [
      { label: 'Pending Orders', value: pending },
      { label: 'Preparing', value: preparing },
      { label: 'Completed Revenue', value: revenue },
      { label: 'Total Orders', value: this.allOrders.length }
    ];
  }

  private updateTabCounts(): void {
    this.tabs.forEach(tab => {
      tab.count = tab.value === 'ALL' ? this.allOrders.length : this.allOrders.filter(o => o.status === tab.value).length;
    });
  }

  private normalizeOrder(order: Order): Order {
    return {
      ...order,
      type: order.type ?? order.orderType,
      subtotal: order.subtotal ?? order.subtotalAmount ?? 0,
      discount: order.discount ?? order.discountAmount ?? 0,
      customerAddress: order.customerAddress ?? order.deliveryAddress,
      priority: order.priority ?? 'NORMAL',
      timeline: order.timeline ?? this.buildTimeline(order),
      items: (order.items ?? []).map((item) => {
        const size = item.size ?? item.variantName;
        const variant = item.variant && item.variant !== size ? item.variant : undefined;

        return {
          ...item,
          name: item.name ?? item.productName,
          variant,
          price: item.price ?? item.unitPrice ?? 0,
          size,
          toppings: (item.toppings ?? []).map(topping => {
            const quantity = Number(topping.quantity) || 1;
            const unitPrice = Number(topping.unitPrice) || Number(topping.price) || 0;
            const totalPrice = Number(topping.totalPrice) || unitPrice * quantity;

            return {
              ...topping,
              name: topping.name ?? topping.toppingName,
              quantity,
              unitPrice,
              totalPrice,
              price: unitPrice
            };
          })
        };
      })
    };
  }

  private buildTimeline(order: Order) {
    return [
      { status: 'REJECTED' as OrderStatus, time: order.rejectedAt ?? '', note: order.rejectReason || 'Rejected' },
      { status: 'CANCELLED' as OrderStatus, time: order.cancelledAt ?? '', note: order.cancelReason || 'Cancelled' },
      { status: 'COMPLETED' as OrderStatus, time: order.completedAt ?? '', note: 'Completed' },
      { status: 'DELIVERING' as OrderStatus, time: order.deliveringAt ?? '', note: 'Delivering' },
      { status: 'READY' as OrderStatus, time: order.readyAt ?? '', note: 'Ready' },
      { status: 'PREPARING' as OrderStatus, time: order.preparedAt ?? '', note: 'Preparing' },
      { status: 'CONFIRMED' as OrderStatus, time: order.confirmedAt ?? '', note: 'Confirmed' },
      { status: 'PENDING' as OrderStatus, time: order.createdAt, note: 'Order created' }
    ].filter(item => item.time);
  }
}
