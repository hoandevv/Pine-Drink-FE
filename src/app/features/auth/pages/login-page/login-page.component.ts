import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { TokenService } from '../../../../core/services/token.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoginRequest } from '../../models/login-request.model';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {
  readonly loginForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  submitting = false;
  showPassword = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for reset password success message
    const resetSuccess = this.route.snapshot.queryParamMap.get('resetSuccess');
    if (resetSuccess === 'true') {
      this.toastService.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      // Clear the query param
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }

    if (this.authService.isAuthenticated()) {
      // Redirect based on user role
      const redirectUrl = this.getRedirectUrlByRole();
      this.router.navigate([redirectUrl]);
    }
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const request: LoginRequest = this.loginForm.getRawValue();

    this.authService.login(request).subscribe({
      next: () => {
        this.toastService.success('Đăng nhập thành công.');
        
        // Check if there's a redirect URL from query params
        const requestedRedirect = this.route.snapshot.queryParamMap.get('redirectUrl');
        
        // If there's a requested redirect and it's not an auth page, use it
        if (requestedRedirect && !requestedRedirect.startsWith('/auth')) {
          this.router.navigateByUrl(requestedRedirect);
        } else {
          // Otherwise, redirect based on user role
          const redirectUrl = this.getRedirectUrlByRole();
          this.router.navigate([redirectUrl]);
        }
      },
      error: () => {
        this.submitting = false;
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private getRedirectUrlByRole(): string {
    const user = this.tokenService.getCurrentUserFromToken();
    const roles = user?.roles ?? [];
    
    // Check if user has admin role
    const isAdmin = roles.some((role) => 
      ['ADMIN', 'ROLE_ADMIN'].includes(role.toUpperCase())
    );
    
    // Redirect admin to dashboard, customer to home
    return isAdmin ? '/admin/dashboard' : '/';
  }
}
