import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { OrderListComponent } from './pages/order-list/order-list.component';
import { OrdersRoutingModule } from './orders-routing.module';
import { OrderService } from './services/order.service';

@NgModule({
  declarations: [OrderListComponent],
  imports: [SharedModule, OrdersRoutingModule],
  providers: [OrderService]
})
export class OrdersModule {}
