import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { ToppingsRoutingModule } from './toppings-routing.module';
import { ToppingsPageComponent } from './pages/toppings-page/toppings-page.component';

@NgModule({
  declarations: [ToppingsPageComponent],
  imports: [SharedModule, ToppingsRoutingModule]
})
export class ToppingsModule {}
