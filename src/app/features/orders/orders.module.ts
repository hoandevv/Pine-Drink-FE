import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { OrderListComponent } from './pages/order-list/order-list.component';
import { OrdersRoutingModule } from './orders-routing.module';

import { OrderStatsComponent } from './components/order-stats.component';
import { OrderStatusBadgeComponent } from './components/order-status-badge.component';
import { PaymentBadgeComponent } from './components/payment-badge.component';
import { OrderFilterBarComponent } from './components/order-filter-bar.component';
import { OrderTableComponent } from './components/order-table.component';
import { OrderKanbanComponent } from './components/order-kanban.component';
import { OrderDetailDrawerComponent } from './components/order-detail-drawer.component';

@NgModule({
  declarations: [
    OrderListComponent,
    OrderStatsComponent,
    OrderStatusBadgeComponent,
    PaymentBadgeComponent,
    OrderFilterBarComponent,
    OrderTableComponent,
    OrderKanbanComponent,
    OrderDetailDrawerComponent
  ],
  imports: [SharedModule, OrdersRoutingModule]
})
export class OrdersModule {}

