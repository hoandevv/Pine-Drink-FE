import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Order, OrderItem } from '../../models/order.model';

@Component({
  selector: 'app-order-table',
  templateUrl: './order-table.component.html',
  styleUrls: ['./order-table.component.scss']
})
export class OrderTableComponent {
  @Input() orders: Order[] = [];
  @Output() rowClick = new EventEmitter<Order>();
  @Output() actionClick = new EventEmitter<{order: Order, type: string}>();

  getItemsPreview(order: Order): string {
    return order.items.map((i: OrderItem) => i.name || i.productName || 'Item').join(', ');
  }
}
