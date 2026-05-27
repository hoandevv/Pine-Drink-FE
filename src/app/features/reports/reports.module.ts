import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsPageComponent } from './pages/reports-page/reports-page.component';

@NgModule({
  declarations: [ReportsPageComponent],
  imports: [SharedModule, ReportsRoutingModule]
})
export class ReportsModule {}
