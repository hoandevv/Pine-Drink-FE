import { Component, Input } from '@angular/core';
import { OrderStatus } from '../models/order.model';

@Component({
  selector: 'app-order-status-badge',
  template: `
    <span class="badge" [ngClass]="status.toLowerCase()">
      {{ status }}
    </span>
  `,
  styles: [`
    .badge {
      padding: 6px 12px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }
    .pending { background: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }
    .confirmed { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
    .preparing { background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; }
    .ready { background: #fdf4ff; color: #a21caf; border: 1px solid #fae8ff; }
    .delivering { background: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff; }
    .completed { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
    .cancelled { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
    .rejected { background: #fff1f2; color: #be123c; border: 1px solid #ffe4e6; }
  `]
})
export class OrderStatusBadgeComponent {
  @Input() status: OrderStatus = 'PENDING';
}

