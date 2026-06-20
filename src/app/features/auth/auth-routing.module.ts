import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../core/guards/auth.guard';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page/forgot-password-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page.component';
import { VerifyOtpPageComponent } from './pages/verify-otp-page/verify-otp-page.component';

const routes: Routes = [
  { path: 'login', component: LoginPageComponent, canActivate: [AuthGuard], data: { guestOnly: true } },
  { path: 'register', component: RegisterPageComponent, canActivate: [AuthGuard], data: { guestOnly: true } },
  { path: 'verify-otp', component: VerifyOtpPageComponent, canActivate: [AuthGuard], data: { guestOnly: true } },
  { path: 'forgot-password', component: ForgotPasswordPageComponent, canActivate: [AuthGuard], data: { guestOnly: true } },
  { path: 'reset-password', component: ResetPasswordPageComponent, canActivate: [AuthGuard], data: { guestOnly: true } },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {}
