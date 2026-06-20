import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { Order, OrderStatus } from '../../models/order.model';
import { OrderStat } from '../../components/order-stats.component';
import { OrderRealtimeEnvelope, OrderRealtimeService } from '../../services/order-realtime.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit, OnDestroy {
  viewMode: 'table' | 'kanban' = 'table';
  isDrawerOpen = false;
  isLoading = false;
  selectedOrder: Order | null = null;
  activeTab: OrderStatus | 'ALL' = 'ALL';
  private readonly subscriptions = new Subscription();
  private readonly subscribedBranchIds = new Set<string>();

  stats: OrderStat[] = [];
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
    private readonly orderRealtimeService: OrderRealtimeService
  ) {}

  ngOnInit(): void {
    this.listenOrderRealtime();
    this.refreshData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  refreshData(): void {
    this.isLoading = true;
    this.orderService.getOrders(0, 100, this.activeTab).subscribe({
      next: (response) => {
        this.pageData = response;
        this.allOrders = response.content ?? [];
        this.orders = this.allOrders;
        this.subscribeLoadedBranches();
        this.updateStats();
        this.updateTabCounts();
      },
      error: (error) => {
        console.error('Load orders failed', error);
        this.orders = [];
        this.allOrders = [];
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
    this.refreshData();
  }

  onFilterChange(filters: any): void {
    const keyword = (filters?.keyword ?? filters?.search ?? '').toString().trim().toLowerCase();
    if (!keyword) {
      this.orders = this.allOrders;
      return;
    }

    this.orders = this.allOrders.filter((order) =>
      [order.orderCode, order.customerName, order.customerPhone, order.branchName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword))
    );
  }

  openDetail(order: Order): void {
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

  onStatusChange({ order, status }: { order: Order; status: OrderStatus }): void {
    this.orderService.updateOrderStatus(order.id, status).subscribe({
      next: (updatedOrder) => {
        const normalized = this.normalizeOrder(updatedOrder);
        this.allOrders = this.allOrders.map(o => o.id === order.id ? normalized : o);
        this.orders = this.orders.map(o => o.id === order.id ? normalized : o);
        if (this.selectedOrder?.id === order.id) {
          this.selectedOrder = normalized;
        }
        this.updateStats();
        this.updateTabCounts();
      },
      error: (error) => console.error('Update order status failed', error)
    });
  }

  private listenOrderRealtime(): void {
    this.subscriptions.add(
      this.orderRealtimeService.orderEvents$.subscribe(event => this.applyRealtimeEvent(event))
    );
    this.orderRealtimeService.connect();
  }

  private subscribeLoadedBranches(): void {
    this.allOrders
      .map(order => order.branchId)
      .filter((branchId): branchId is string => !!branchId)
      .forEach(branchId => {
        if (!this.subscribedBranchIds.has(branchId)) {
          this.subscribedBranchIds.add(branchId);
          this.orderRealtimeService.subscribeBranchOrders(branchId);
        }
      });
  }

  private applyRealtimeEvent(event: OrderRealtimeEnvelope): void {
    const incoming = (event.payload || event.data || {}) as Partial<Order>;
    const incomingId = incoming.id || event.targetId;
    if (!incomingId || !this.allOrders.some(order => order.id === incomingId)) {
      return;
    }

    const mergeOrder = (order: Order): Order =>
      order.id === incomingId ? this.normalizeOrder({ ...order, ...incoming } as Order) : order;

    this.allOrders = this.allOrders.map(mergeOrder);
    this.orders = this.orders.map(mergeOrder);

    if (this.selectedOrder?.id === incomingId) {
      this.selectedOrder = this.normalizeOrder({ ...this.selectedOrder, ...incoming } as Order);
    }

    this.updateStats();
    this.updateTabCounts();
  }

  private updateStats(): void {
    const pending = this.allOrders.filter(o => o.status === 'PENDING').length;
    const preparing = this.allOrders.filter(o => o.status === 'PREPARING').length;
    const revenue = this.allOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    this.stats = [
      { label: 'Pending Orders', value: pending, change: 0, icon: 'fiber_Pending', color: 'amber', trend: 'up' },
      { label: 'Preparing', value: preparing, change: 0, icon: 'local_cafe', color: 'orange', trend: 'up' },
      { label: 'Completed Revenue', value: this.formatCompactCurrency(revenue), change: 0, icon: 'payments', color: 'pine', trend: 'up' },
      { label: 'Total Orders', value: this.allOrders.length, change: 0, icon: 'receipt_long', color: 'blue', trend: 'up' }
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
      items: (order.items ?? []).map((item) => ({
        ...item,
        name: item.name ?? item.productName,
        variant: item.variant ?? item.variantName,
        price: item.price ?? item.unitPrice ?? 0,
        size: item.size ?? item.variantName,
        toppings: item.toppings ?? []
      }))
    };
  }

  private buildTimeline(order: Order) {
    return [
      { status: 'REJECTED' as OrderStatus, time: order.rejectedAt ?? '', note: 'Rejected' },
      { status: 'CANCELLED' as OrderStatus, time: order.cancelledAt ?? '', note: order.cancelReason },
      { status: 'COMPLETED' as OrderStatus, time: order.completedAt ?? '', note: 'Completed' },
      { status: 'DELIVERING' as OrderStatus, time: order.deliveringAt ?? '', note: 'Delivering' },
      { status: 'READY' as OrderStatus, time: order.readyAt ?? '', note: 'Ready' },
      { status: 'PREPARING' as OrderStatus, time: order.preparedAt ?? '', note: 'Preparing' },
      { status: 'CONFIRMED' as OrderStatus, time: order.confirmedAt ?? '', note: 'Confirmed' },
      { status: 'PENDING' as OrderStatus, time: order.createdAt, note: 'Order created' }
    ].filter(item => item.time);
  }

  private formatCompactCurrency(value: number): string {
    if (value >= 1000000) {
      return `${Math.round(value / 100000) / 10}m`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)}k`;
    }
    return `${value}`;
  }
}

