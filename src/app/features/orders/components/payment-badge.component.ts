import { Component, Input } from '@angular/core';
import { PaymentStatus } from '../models/order.model';

@Component({
  selector: 'app-payment-badge',
  template: `
    <span class="p-badge" [ngClass]="status.toLowerCase()">
      <span class="material-symbols-outlined">{{ status === 'PAID' ? 'check_circle' : 'pending' }}</span>
      {{ status }}
    </span>
  `,
  styles: [`
    .p-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      .material-symbols-outlined { font-size: 14px; }
    }
    .paid { background: #f0fdf4; color: #16a34a; }
    .unpaid { background: #fef2f2; color: #dc2626; }
    .refunded { background: #f1f5f9; color: #64748b; }
  `]
})
export class PaymentBadgeComponent {
  @Input() status: PaymentStatus = 'UNPAID';
}
