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
      min-height: 28px;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: .065em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      border: 1px solid transparent;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
    }
    .pending { background: #ecfdf5; color: #047857; border-color: #bbf7d0; }
    .confirmed { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .preparing { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
    .ready { background: #f5f3ff; color: #7e22ce; border-color: #e9d5ff; }
    .delivering { background: #eef2ff; color: #4338ca; border-color: #c7d2fe; }
    .completed { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
    .cancelled { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
    .rejected { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
  `]
})
export class OrderStatusBadgeComponent {
  @Input() status: OrderStatus = 'PENDING';
}
