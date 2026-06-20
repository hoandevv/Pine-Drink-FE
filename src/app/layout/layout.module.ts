import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';
import { ClientLayoutComponent } from './client-layout/client-layout.component';

@NgModule({
  declarations: [AdminLayoutComponent, AuthLayoutComponent, ClientLayoutComponent],
  imports: [SharedModule, RouterModule],
  exports: [AdminLayoutComponent, AuthLayoutComponent, ClientLayoutComponent]
})
export class LayoutModule {}
