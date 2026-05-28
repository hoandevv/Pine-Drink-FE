import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  readonly filterForm = this.formBuilder.nonNullable.group({ status: [''] });
  readonly statusOptions: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'];

  orders: Order[] = [];
  pageData: PageResponse<Order> = {
    content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true
  };

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnInit(): void { this.loadOrders(); }

  search(): void { this.loadOrders(0); }

  onPageChange(page: number): void { this.loadOrders(page); }

  onStatusChange(order: Order, event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const status = target?.value as OrderStatus | undefined;
    if (!status || status === order.status) { return; }

    this.orders = this.orders.map((item) => (item.id === order.id ? { ...item, status } : item));
    this.pageData = {
      ...this.pageData,
      content: this.orders
    };
  }

  private readonly mockOrders: Order[] = [
    { id: 'o1', orderCode: 'PD-10492', customerName: 'Nguyễn Hoàng An', customerPhone: '0901222345', totalAmount: 186000, status: 'PREPARING', paymentStatus: 'PAID', createdAt: 'Hôm nay 09:12' },
    { id: 'o2', orderCode: 'PD-10491', customerName: 'Lê Khánh Vy', customerPhone: '0933120777', totalAmount: 98000, status: 'CONFIRMED', paymentStatus: 'UNPAID', createdAt: 'Hôm nay 08:48' },
    { id: 'o3', orderCode: 'PD-10490', customerName: 'Trần Minh Tú', customerPhone: '0918445102', totalAmount: 242000, status: 'COMPLETED', paymentStatus: 'PAID', createdAt: 'Hôm qua 21:05' },
    { id: 'o4', orderCode: 'PD-10489', customerName: 'Walk-in', customerPhone: '', totalAmount: 59000, status: 'PENDING', paymentStatus: 'UNPAID', createdAt: 'Hôm qua 18:22' }
  ];

  private loadOrders(page = 0): void {
    const status = this.filterForm.getRawValue().status;
    const content = status ? this.mockOrders.filter((order) => order.status === status) : this.mockOrders;

    this.orders = content;
    this.pageData = {
      content,
      page,
      size: content.length || 10,
      totalElements: content.length,
      totalPages: content.length > 0 ? 1 : 0,
      first: true,
      last: true
    };
  }
}
