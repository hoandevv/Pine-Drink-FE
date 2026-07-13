import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api-endpoints';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../services/loading.service';
import { TokenService } from '../services/token.service';
/**
 * Thực hiện làm mới accessToken khi hết hạn.
 */
@Injectable()
export class RefreshTokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private readonly refreshedToken$ = new BehaviorSubject<string | null>(null);
  private readonly authEndpointsToSkip = new Set<string>([
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
  ]);

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly router: Router,
    private readonly loadingService: LoadingService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!this.shouldRefresh(request, error)) {
          return throwError(() => error);
        }

        return this.handleUnauthorized(request, next);
      })
    );
  }

  private shouldRefresh(request: HttpRequest<unknown>, error: HttpErrorResponse): boolean {
    return error.status === 401 && !!this.tokenService.getRefreshToken() && !this.isAuthEndpointToSkip(request.url);
  }

  private handleUnauthorized(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isRefreshing) {
      return this.refreshedToken$.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap((token) => next.handle(this.addAuthorizationHeader(request, token)))
      );
    }

    this.isRefreshing = true;
    this.refreshedToken$.next(null);

    return this.authService.refreshToken().pipe(
      switchMap((response) => {
        this.isRefreshing = false;
        this.refreshedToken$.next(response.accessToken);
        return next.handle(this.addAuthorizationHeader(request, response.accessToken));
      }),
      catchError((refreshError) => {
        this.endSession();
        return throwError(() => refreshError);
      })
    );
  }

  private addAuthorizationHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private isAuthEndpointToSkip(url: string): boolean {
    return Array.from(this.authEndpointsToSkip).some((endpoint) => url.includes(endpoint));
  }

  private endSession(): void {
    this.isRefreshing = false;
    this.refreshedToken$.next(null);
    this.tokenService.clearTokens();
    this.loadingService.reset();
    this.router.navigate(['/auth/login']);
  }
}
