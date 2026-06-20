import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { VouchersPageComponent } from './pages/vouchers-page/vouchers-page.component';

const routes: Routes = [{ path: '', component: VouchersPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VouchersRoutingModule {}
