import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page/forgot-password-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page.component';

@NgModule({
  declarations: [
    LoginPageComponent, 
    RegisterPageComponent, 
    ForgotPasswordPageComponent,
    ResetPasswordPageComponent
  ],
  imports: [SharedModule, AuthRoutingModule]
})
export class AuthModule {}
