import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, throwError } from 'rxjs';

import { ApiError } from '../../shared/models/api-error.model';
import { FieldError } from '../../shared/models/field-error.model';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';
import { TokenService } from '../services/token.service';

interface ErrorPayload {
  errorCode?: string | null;
  message?: string;
  fieldErrors?: FieldError[];
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private readonly router: Router,
    private readonly tokenService: TokenService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.loadingService.show();

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const apiError = this.mapApiError(error);
        this.handleError(apiError);
        return throwError(() => apiError);
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  private mapApiError(error: HttpErrorResponse): ApiError {
    const payload = (error.error ?? {}) as ErrorPayload;

    return {
      status: error.status,
      errorCode: payload.errorCode ?? undefined,
      message: payload.message ?? this.resolveFallbackMessage(error.status),
      fieldErrors: payload.fieldErrors ?? []
    };
  }

  private handleError(error: ApiError): void {
    switch (error.status) {
      case 0:
        this.toastService.error('Khong the ket noi toi server. Vui long kiem tra backend.');
        break;
      case 400:
        this.toastService.warning(this.resolveValidationMessage(error));
        break;
      case 401:
        this.tokenService.clearTokens();
        this.loadingService.reset();
        this.toastService.error('Phien dang nhap da het han. Vui long dang nhap lai.');
        this.router.navigate(['/auth/login']);
        break;
      case 403:
        this.toastService.error('Ban khong co quyen truy cap tai nguyen nay.');
        break;
      case 404:
        this.toastService.warning(error.message || 'Khong tim thay du lieu.');
        break;
      default:
        this.toastService.error(error.message || 'He thong dang gap loi. Vui long thu lai sau.');
        break;
    }
  }

  private resolveValidationMessage(error: ApiError): string {
    if (error.fieldErrors && error.fieldErrors.length > 0) {
      return error.fieldErrors.map((fieldError) => `${fieldError.field}: ${fieldError.message}`).join(' | ');
    }

    return error.message || 'Du lieu gui len khong hop le.';
  }

  private resolveFallbackMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Du lieu gui len khong hop le.';
      case 401:
        return 'Khong duoc phep truy cap.';
      case 403:
        return 'Ban khong co quyen thuc hien thao tac nay.';
      case 404:
        return 'Khong tim thay du lieu.';
      case 500:
        return 'He thong dang gap loi.';
      default:
        return 'Da xay ra loi khong xac dinh.';
    }
  }
}
