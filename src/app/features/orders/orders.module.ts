import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { OrderListComponent } from './pages/order-list/order-list.component';
import { OrdersRoutingModule } from './orders-routing.module';

import { OrderStatsComponent } from './components/order-stats/order-stats.component';
import { OrderStatusBadgeComponent } from './components/order-status-badge/order-status-badge.component';
import { PaymentBadgeComponent } from './components/payment-badge/payment-badge.component';
import { OrderFilterBarComponent } from './components/order-filter-bar/order-filter-bar.component';
import { OrderTableComponent } from './components/order-table/order-table.component';
import { OrderKanbanComponent } from './components/order-kanban/order-kanban.component';
import { OrderDetailDrawerComponent } from './components/order-detail-drawer/order-detail-drawer.component';

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

