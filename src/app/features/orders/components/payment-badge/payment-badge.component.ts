import { Component, Input } from '@angular/core';
import { PaymentStatus } from '../../models/order.model';

@Component({
  selector: 'app-payment-badge',
  templateUrl: './payment-badge.component.html',
  styleUrls: ['./payment-badge.component.scss']
})
export class PaymentBadgeComponent {
  @Input() status: PaymentStatus = 'UNPAID';
}
