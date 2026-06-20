import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { PermissionsRoutingModule } from './permissions-routing.module';
import { PermissionsPageComponent } from './pages/permissions-page/permissions-page.component';
import { PermissionService } from './services/permission.service';

@NgModule({
  declarations: [PermissionsPageComponent],
  imports: [SharedModule, PermissionsRoutingModule],
  providers: [PermissionService]
})
export class PermissionsModule {}
