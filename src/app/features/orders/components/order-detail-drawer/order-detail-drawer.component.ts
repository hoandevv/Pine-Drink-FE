import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-order-detail-drawer',
  templateUrl: './order-detail-drawer.component.html',
  styleUrls: ['./order-detail-drawer.component.scss']
})
export class OrderDetailDrawerComponent {
  @Input() order: Order | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<{order: Order, status: OrderStatus}>();
}

