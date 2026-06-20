import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { AccountsRoutingModule } from './accounts-routing.module';
import { AccountsPageComponent } from './pages/accounts-page/accounts-page.component';

@NgModule({
  declarations: [AccountsPageComponent],
  imports: [SharedModule, AccountsRoutingModule]
})
export class AccountsModule {}
