import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { AccessControlService } from '../../../../core/services/access-control.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { LoginRequest } from '../../models/login-request.model';

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
        this.handleLoginSuccess('Đăng nhập thành công.');
      },
      error: () => {
        this.submitting = false;
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
        // Error toast is handled by HTTP interceptor
      },
      complete: () => {
        this.googleSubmitting = false;
      }
    });
  }

  private handleLoginSuccess(message: string): void {
    this.toastService.success(message);

    // Check if there's a redirect URL from query params
    const requestedRedirect = this.route.snapshot.queryParamMap.get('redirectUrl');

    // If there's a requested redirect and it's not an auth page, use it
    if (requestedRedirect && !requestedRedirect.startsWith('/auth')) {
      this.router.navigateByUrl(requestedRedirect);
      return;
    }

    // Otherwise, redirect based on user role
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
      // Retry up to 10 times (3 seconds total) waiting for script to load
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

    // Initialize Google Identity Services and render the official button.
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
    return this.accessControl.isAdminConsoleUser() ? '/admin/dashboard' : '/';
  }
}
