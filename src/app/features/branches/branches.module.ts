import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { BranchesRoutingModule } from './branches-routing.module';
import { BranchesPageComponent } from './pages/branches-page/branches-page.component';
import { BranchService } from './services/branch.service';

@NgModule({
  declarations: [BranchesPageComponent],
  imports: [SharedModule, BranchesRoutingModule],
  providers: [BranchService]
})
export class BranchesModule {}
