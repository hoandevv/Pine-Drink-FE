import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BranchesPageComponent } from './pages/branches-page/branches-page.component';

const routes: Routes = [{ path: '', component: BranchesPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchesRoutingModule {}
