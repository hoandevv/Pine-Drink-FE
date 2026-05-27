import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { CustomersRoutingModule } from './customers-routing.module';
import { CustomersPageComponent } from './pages/customers-page/customers-page.component';

@NgModule({
  declarations: [CustomersPageComponent],
  imports: [SharedModule, CustomersRoutingModule]
})
export class CustomersModule {}
