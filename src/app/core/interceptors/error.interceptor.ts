import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, throwError } from 'rxjs';

import { ApiError } from '../../shared/models/api-error.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ApiErrorMessageService } from '../services/api-error-message.service';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';
import { TokenService } from '../services/token.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly sessionExpiredCodes = new Set(['AUTH_002', 'AUTH_003', 'AUTH_004']);
  private readonly refreshableUnauthorizedCodes = new Set(['AUTH_002', 'AUTH_003', 'AUTH_004', 'AUTH_012']);
  private readonly authEndpointsToHandleImmediately = [
    API_ENDPOINTS.auth.login,
    API_ENDPOINTS.auth.google,
    API_ENDPOINTS.auth.register,
    API_ENDPOINTS.auth.verifyRegisterOtp,
    API_ENDPOINTS.auth.resendRegisterOtp,
    API_ENDPOINTS.auth.refreshToken,
    API_ENDPOINTS.auth.logout,
    API_ENDPOINTS.auth.forgotPassword,
    API_ENDPOINTS.auth.verifyForgotPasswordOtp,
    API_ENDPOINTS.auth.resetPassword
  ];

  constructor(
    private readonly router: Router,
    private readonly tokenService: TokenService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly apiErrorMessage: ApiErrorMessageService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const skipLoading = request.headers.has('X-Skip-Loading');
    const skipErrorToast = request.headers.has('X-Skip-Error-Toast');
    const handledRequest = request.clone({
      headers: request.headers
        .delete('X-Skip-Loading')
        .delete('X-Skip-Error-Toast')
    });

    if (!skipLoading) {
      this.loadingService.show();
    }

    return next.handle(handledRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        const apiError = this.apiErrorMessage.toApiError(error);
        if (!skipErrorToast) {
          this.handleError(apiError, handledRequest);
        }
        return throwError(() => apiError);
      }),
      finalize(() => {
        if (!skipLoading) {
          this.loadingService.hide();
        }
      })
    );
  }

  private handleError(error: ApiError, request: HttpRequest<unknown>): void {
    const message = this.apiErrorMessage.resolve(error);

    switch (error.status) {
      case 400:
      case 404:
      case 409:
      case 429:
        this.toastService.warning(message);
        break;
      case 401:
        this.handleUnauthorized(error, message, request);
        break;
      default:
        this.toastService.error(message);
        break;
    }
  }

  private handleUnauthorized(error: ApiError, message: string, request: HttpRequest<unknown>): void {
    if (error.errorCode && !this.refreshableUnauthorizedCodes.has(error.errorCode)) {
      this.toastService.warning(message);
      return;
    }

    if (this.canRefreshSession(request)) {
      return;
    }

    const shouldEndSession = !error.errorCode || this.sessionExpiredCodes.has(error.errorCode);

    if (!shouldEndSession) {
      this.toastService.warning(message);
      return;
    }

    this.tokenService.clearTokens();
    this.loadingService.reset();
    this.toastService.warning(message);
    this.router.navigate(['/auth/login']);
  }

  private canRefreshSession(request: HttpRequest<unknown>): boolean {
    return Boolean(
      this.tokenService.getRefreshToken() &&
      !this.authEndpointsToHandleImmediately.some((endpoint) => this.isAuthEndpoint(request.url, endpoint))
    );
  }

  private isAuthEndpoint(url: string, endpoint: string): boolean {
    return url.includes(endpoint);
  }
}
