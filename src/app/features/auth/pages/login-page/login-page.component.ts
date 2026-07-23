import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { AccessControlService } from '../../../../core/services/access-control.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { LoginRequest } from '../../models/login-request.model';
import { ApiError } from '../../../../shared/models/api-error.model';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: 'popup' | 'redirect';
            context?: 'signin' | 'signup' | 'use';
          }) => void;
          prompt: (momentListener?: (notification: {
            isDisplayMoment: () => boolean;
            isDisplayed: () => boolean;
            isNotDisplayed: () => boolean;
            getNotDisplayedReason: () => string;
            isSkippedMoment: () => boolean;
            getSkippedReason: () => string;
            isDismissedMoment: () => boolean;
            getDismissedReason: () => string;
            getMomentType: () => string;
          }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly loginForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  submitting = false;
  googleSubmitting = false;
  showPassword = false;

  private googleInitTimerId?: number;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly accessControl: AccessControlService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Kiểm tra thông báo đặt lại mật khẩu thành công
    const resetSuccess = this.route.snapshot.queryParamMap.get('resetSuccess');
    if (resetSuccess === 'true') {
      this.toastService.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      // Xóa query param sau khi hiển thị thông báo
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }

    if (this.authService.isAuthenticated()) {
      // Chuyển hướng theo vai trò người dùng
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
        this.handleLoginSuccess('Đăng nhập thành công.');
      },
      error: (error: ApiError) => {
        this.submitting = false;
        
        if (error.errorCode === 'AUTH_006') {
          // Nếu người dùng nhập email, tự điền email ở trang OTP
          const queryParams: { email?: string } = {};
          if (request.username.includes('@')) {
            queryParams.email = request.username;
          }

          this.router.navigate(['/auth/verify-otp'], { queryParams });
        }
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  ngAfterViewInit(): void {
    // Only initialize if Google Client ID is configured
    if (environment.googleClientId) {
      this.initGoogleIdentity();
    }
  }

  ngOnDestroy(): void {
    if (this.googleInitTimerId) {
      window.clearTimeout(this.googleInitTimerId);
    }
  }

  loginWithGoogle(): void {
    this.toastService.error('Google Sign-In đang được tải lại. Vui lòng thử lại sau vài giây.');
    this.initGoogleIdentity();
  }

  handleGoogleCredential(response: { credential?: string }): void {
    const idToken = response.credential;
    if (!idToken) {
      this.googleSubmitting = false;
      this.toastService.error('Không nhận được thông tin từ Google.');
      return;
    }

    this.googleSubmitting = true;

    this.authService.googleLogin(idToken).subscribe({
      next: () => {
        this.handleLoginSuccess('Đăng nhập Google thành công!');
      },
      error: (error) => {
        console.error('[Google OAuth] Login failed:', error);
        this.googleSubmitting = false;
        // Toast lỗi được xử lý trong HTTP interceptor
      },
      complete: () => {
        this.googleSubmitting = false;
      }
    });
  }

  private handleLoginSuccess(message: string): void {
    this.toastService.success(message);

    // Kiểm tra redirect URL từ query params
    const requestedRedirect = this.route.snapshot.queryParamMap.get('redirectUrl');

    // Nếu có redirect URL hợp lệ và không phải trang auth thì dùng redirect đó
    if (requestedRedirect && !requestedRedirect.startsWith('/auth')) {
      this.router.navigateByUrl(requestedRedirect);
      return;
    }

    // Nếu không có redirect URL thì chuyển hướng theo vai trò người dùng
    const redirectUrl = this.getRedirectUrlByRole();
    this.router.navigate([redirectUrl]);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private initGoogleIdentity(retryCount = 0): void {
    if (!environment.googleClientId) {
      console.warn('[Google OAuth] Client ID not configured');
      return;
    }

    if (!window.google?.accounts?.id) {
      // Thử lại tối đa 10 lần (tổng 3 giây) để chờ script Google tải xong
      if (retryCount < 10) {
        this.googleInitTimerId = window.setTimeout(
          () => this.initGoogleIdentity(retryCount + 1),
          300
        );
      } else {
        console.error('[Google OAuth] Failed to load Google Identity Services after 3 seconds');
      }
      return;
    }

    // Khởi tạo Google Identity Services và render nút Google chính thức.
    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response) => this.handleGoogleCredential(response)
    });

    const buttonHost = document.getElementById('google-signin-button');
    if (buttonHost) {
      buttonHost.innerHTML = '';
      window.google.accounts.id.renderButton(buttonHost, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 240
      });
    }
  }

  private getRedirectUrlByRole(): string {
    if (this.accessControl.isAdminConsoleUser()) {
      return '/admin/dashboard';
    }

    return '/';
  }
}
