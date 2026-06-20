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
      min-height: 28px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 9px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 950;
      letter-spacing: .04em;
      border: 1px solid transparent;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
      .material-symbols-outlined {
        font-size: 14px;
      }
    }
    .paid {
      background: #f0fdf4;
      color: #15803d;
      border-color: #bbf7d0;
    }
    .unpaid {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    .refunded {
      background: #f8faf8;
      color: #647067;
      border-color: #e5ebe5;
    }
  `]
})
export class PaymentBadgeComponent {
  @Input() status: PaymentStatus = 'UNPAID';
}
