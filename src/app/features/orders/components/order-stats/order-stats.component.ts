import { Component, Input } from '@angular/core';

import { OrderStat } from '../../models/order-stat.model';

@Component({
  selector: 'app-order-stats',
  templateUrl: './order-stats.component.html',
  styleUrls: ['./order-stats.component.scss']
})
export class OrderStatsComponent {
  @Input() stats: OrderStat[] = [];
}
