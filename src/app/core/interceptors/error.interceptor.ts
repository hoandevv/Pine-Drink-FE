import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, throwError } from 'rxjs';

import { ApiError } from '../../shared/models/api-error.model';
import { ApiErrorMessageService } from '../services/api-error-message.service';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';
import { TokenService } from '../services/token.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly sessionExpiredCodes = new Set(['AUTH_002', 'AUTH_003', 'AUTH_004']);

  constructor(
    private readonly router: Router,
    private readonly tokenService: TokenService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly apiErrorMessage: ApiErrorMessageService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const skipLoading = request.headers.has('X-Skip-Loading');
    const handledRequest = skipLoading
      ? request.clone({ headers: request.headers.delete('X-Skip-Loading') })
      : request;

    if (!skipLoading) {
      this.loadingService.show();
    }

    return next.handle(handledRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        const apiError = this.apiErrorMessage.toApiError(error);
        this.handleError(apiError);
        return throwError(() => apiError);
      }),
      finalize(() => {
        if (!skipLoading) {
          this.loadingService.hide();
        }
      })
    );
  }

  private handleError(error: ApiError): void {
    const message = this.apiErrorMessage.resolve(error);

    switch (error.status) {
      case 400:
      case 404:
      case 409:
      case 429:
        this.toastService.warning(message);
        break;
      case 401:
        this.handleUnauthorized(error, message);
        break;
      default:
        this.toastService.error(message);
        break;
    }
  }

  private handleUnauthorized(error: ApiError, message: string): void {
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
}
