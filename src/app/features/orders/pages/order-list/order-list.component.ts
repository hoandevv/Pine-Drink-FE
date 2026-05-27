import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { ToastService } from '../../../../core/services/toast.service';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { Order, OrderStatus } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

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

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly orderService: OrderService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void { this.loadOrders(); }

  search(): void { this.loadOrders(0); }

  onPageChange(page: number): void { this.loadOrders(page); }

  onStatusChange(order: Order, event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const status = target?.value as OrderStatus | undefined;
    if (!status || status === order.status) { return; }

    this.orderService.updateOrderStatus(order.id, status).subscribe({
      next: (updatedOrder) => {
        this.orders = this.orders.map((item) => (item.id === updatedOrder.id ? updatedOrder : item));
        this.toastService.success('Cap nhat trang thai don hang thanh cong.');
      }
    });
  }

  private loadOrders(page = this.pageData.page): void {
    const status = this.filterForm.getRawValue().status;
    this.orderService.getOrders(page, this.pageData.size, status).subscribe({
      next: (response) => {
        this.orders = response.content;
        this.pageData = response;
      },
      error: () => { this.orders = []; }
    });
  }
}
