import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { Order, OrderStatus } from '../../models/order.model';
import { OrderStat } from '../../components/order-stats.component';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  viewMode: 'table' | 'kanban' = 'table';
  isDrawerOpen = false;
  selectedOrder: Order | null = null;
  activeTab: OrderStatus | 'ALL' = 'ALL';

  stats: OrderStat[] = [];
  orders: Order[] = [];
  pageData: PageResponse<Order> = {
    content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true
  };

  readonly tabs: { label: string; value: OrderStatus | 'ALL'; count: number }[] = [
    { label: 'All', value: 'ALL', count: 0 },
    { label: 'New', value: 'NEW', count: 0 },
    { label: 'Confirmed', value: 'CONFIRMED', count: 0 },
    { label: 'Preparing', value: 'PREPARING', count: 0 },
    { label: 'Ready', value: 'READY', count: 0 },
    { label: 'Completed', value: 'COMPLETED', count: 0 },
    { label: 'Cancelled', value: 'CANCELLED', count: 0 }
  ];

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.orders = this.mockOrders;
    this.updateStats();
    this.updateTabCounts();
    this.filterOrders();
  }

  toggleView(mode: 'table' | 'kanban'): void {
    this.viewMode = mode;
  }

  onTabChange(tab: OrderStatus | 'ALL'): void {
    this.activeTab = tab;
    this.filterOrders();
  }

  onFilterChange(filters: any): void {
    // Logic for advanced filtering would go here
    this.filterOrders();
  }

  openDetail(order: Order): void {
    this.selectedOrder = order;
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  onStatusChange({ order, status }: { order: Order; status: OrderStatus }): void {
    const updatedOrder = { 
      ...order, 
      status, 
      updatedAt: new Date().toLocaleTimeString(),
      timeline: [{ status, time: new Date().toLocaleTimeString() }, ...order.timeline]
    };
    
    this.mockOrders = this.mockOrders.map(o => o.id === order.id ? updatedOrder : o);
    if (this.selectedOrder?.id === order.id) {
      this.selectedOrder = updatedOrder;
    }
    this.refreshData();
  }

  private filterOrders(): void {
    let filtered = this.mockOrders;
    if (this.activeTab !== 'ALL') {
      filtered = filtered.filter(o => o.status === this.activeTab);
    }
    this.orders = filtered;
    this.pageData.totalElements = filtered.length;
    this.pageData.content = filtered;
  }

  private updateStats(): void {
    this.stats = [
      { label: 'New Orders', value: this.mockOrders.filter(o => o.status === 'NEW').length, change: 12, icon: 'fiber_new', color: 'amber', trend: 'up' },
      { label: 'Preparing', value: this.mockOrders.filter(o => o.status === 'PREPARING').length, change: -5, icon: 'local_cafe', color: 'orange', trend: 'down' },
      { label: 'Revenue Today', value: '4,250k', change: 8, icon: 'payments', color: 'pine', trend: 'up' },
      { label: 'Avg Time', value: '14m', change: -2, icon: 'timer', color: 'blue', trend: 'up' }
    ];
  }

  private updateTabCounts(): void {
    this.tabs.forEach(tab => {
      tab.count = tab.value === 'ALL' ? this.mockOrders.length : this.mockOrders.filter(o => o.status === tab.value).length;
    });
  }

  private mockOrders: Order[] = [
    {
      id: '1', orderCode: 'PD-8821', customerName: 'Hoàng Minh', customerPhone: '0901234567',
      totalAmount: 145000, subtotal: 155000, discount: 10000, status: 'NEW', paymentStatus: 'PAID',
      paymentMethod: 'MoMo', type: 'DELIVERY', priority: 'URGENT', createdAt: '10:45 AM',
      items: [
        { id: 'i1', name: 'Pine Green Tea', size: 'L', variant: '50% Sugar', quantity: 2, price: 45000, totalPrice: 90000, toppings: [{ name: 'Aloe Vera', price: 5000 }] }
      ],
      timeline: [{ status: 'NEW', time: '10:45 AM', note: 'Customer placed order via App' }],
      customerAddress: '123 Lê Lợi, Quận 1, TP.HCM'
    },
    {
      id: '2', orderCode: 'PD-8820', customerName: 'Khánh Vy', customerPhone: '0933445566',
      totalAmount: 98000, subtotal: 98000, discount: 0, status: 'PREPARING', paymentStatus: 'UNPAID',
      paymentMethod: 'Cash', type: 'WALK_IN', priority: 'NORMAL', createdAt: '10:30 AM',
      items: [
        { id: 'i2', name: 'Golden Milk Tea', size: 'M', variant: 'Less Ice', quantity: 1, price: 55000, totalPrice: 55000, toppings: [{ name: 'Pearl', price: 10000 }] }
      ],
      timeline: [
        { status: 'CONFIRMED', time: '10:35 AM' },
        { status: 'NEW', time: '10:30 AM' }
      ]
    },
    {
      id: '3', orderCode: 'PD-8819', customerName: 'Anh Tuấn', customerPhone: '0912889900',
      totalAmount: 210000, subtotal: 210000, discount: 0, status: 'READY', paymentStatus: 'PAID',
      paymentMethod: 'Bank Transfer', type: 'PICKUP', priority: 'HIGH', createdAt: '10:15 AM',
      items: [
        { id: 'i3', name: 'Oolong Macchiato', size: 'L', quantity: 3, price: 65000, totalPrice: 195000, toppings: [] }
      ],
      timeline: [
        { status: 'READY', time: '10:40 AM' },
        { status: 'PREPARING', time: '10:25 AM' },
        { status: 'NEW', time: '10:15 AM' }
      ]
    }
  ];
}
