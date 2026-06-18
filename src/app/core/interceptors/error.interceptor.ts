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
  errors?: FieldError[] | null;
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly sessionExpiredCodes = new Set(['AUTH_002', 'AUTH_003', 'AUTH_004']);

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
      fieldErrors: payload.fieldErrors ?? payload.errors ?? []
    };
  }

  private handleError(error: ApiError): void {
    const message = this.resolveMessage(error);

    switch (error.status) {
      case 0:
        this.toastService.error(message);
        break;
      case 400:
      case 409:
        this.toastService.warning(message);
        break;
      case 401:
        this.handleUnauthorized(error, message);
        break;
      case 403:
        this.toastService.error(message);
        break;
      case 404:
        this.toastService.warning(message);
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

    const hadSession = !!this.tokenService.getAccessToken();
    this.tokenService.clearTokens();
    this.loadingService.reset();

    if (this.isProtectedUrl(this.router.url)) {
      this.toastService.warning(message);
      this.router.navigate(['/auth/login'], {
        queryParams: { redirectUrl: this.router.url }
      });
      return;
    }

    if (hadSession) {
      this.toastService.warning(message);
    }
  }

  private isProtectedUrl(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return (
      path.startsWith('/admin') ||
      path.startsWith('/chat') ||
      path.startsWith('/cart') ||
      path.startsWith('/profile') ||
      path.startsWith('/addresses')
    );
  }

  private resolveMessage(error: ApiError): string {
    if (error.status === 400 && error.fieldErrors && error.fieldErrors.length > 0) {
      return this.resolveValidationMessage(error);
    }

    if (error.errorCode) {
      return this.resolveErrorCodeMessage(error.errorCode, error.message);
    }

    return this.resolveFallbackMessage(error.status, error.message);
  }

  private resolveValidationMessage(error: ApiError): string {
    if (error.fieldErrors && error.fieldErrors.length > 0) {
      return error.fieldErrors.map((fieldError) => `${this.resolveFieldName(fieldError.field)}: ${fieldError.message}`).join(' | ');
    }

    return error.message || 'Thông tin gửi lên chưa hợp lệ. Bạn kiểm tra lại nhé.';
  }

  private resolveErrorCodeMessage(errorCode: string, fallback?: string): string {
    const messages: Record<string, string> = {
      COM_001: 'Thông tin gửi lên chưa hợp lệ. Bạn kiểm tra lại các trường nhé.',
      COM_002: 'Hệ thống đang bận một chút. Bạn thử lại sau nhé.',
      COM_003: 'Dữ liệu gửi lên không đúng định dạng.',
      COM_004: 'Tham số yêu cầu chưa hợp lệ.',
      COM_005: 'Không tìm thấy dữ liệu phù hợp.',
      AUTH_001: 'Tên đăng nhập/email hoặc mật khẩu chưa đúng.',
      AUTH_002: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
      AUTH_003: 'Thông tin xác thực không hợp lệ. Vui lòng đăng nhập lại.',
      AUTH_004: 'Phiên đăng nhập không còn hiệu lực. Bạn đăng nhập lại nhé.',
      AUTH_005: 'Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên.',
      AUTH_006: 'Tài khoản chưa được kích hoạt. Vui lòng xác thực OTP trước khi đăng nhập.',
      AUTH_007: 'Bạn chưa có quyền thực hiện thao tác này.',
      AUTH_008: 'Bạn thao tác hơi nhanh. Vui lòng chờ một chút rồi thử lại.',
      AUTH_009: 'Dịch vụ giới hạn truy cập đang tạm thời gián đoạn.',
      AUTH_010: 'Mật khẩu chưa đủ mạnh.',
      AUTH_011: 'Mã đặt lại mật khẩu đã hết hạn.',
      AUTH_012: 'Không tìm thấy tài khoản tương ứng.',
      AUTH_013: 'Tên đăng nhập này đã được sử dụng.',
      AUTH_014: 'Email này đã được sử dụng.',
      AUTH_015: 'Số điện thoại này đã được sử dụng.',
      AUTH_016: 'Mã OTP chưa đúng. Bạn kiểm tra lại nhé.',
      AUTH_017: 'Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.',
      AUTH_018: 'Tài khoản này đã được kích hoạt rồi.',
      AUTH_019: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng gửi lại mã mới.',
      AUTH_020: 'Vui lòng chờ 60 giây trước khi yêu cầu gửi lại OTP.',
      AUTH_021: 'Tài khoản chưa được gán vào trung tâm hoạt động.',
      AUTH_022: 'Kênh đăng ký không hợp lệ.',
      AUTH_023: 'Kênh đăng ký này hiện chưa mở đăng ký công khai.',
      AUTH_024: 'Tên miền trung tâm đã tồn tại.',
      RATE_001: 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.',
      ROLE_001: 'Không tìm thấy vai trò phù hợp.',
      SCOPE_001: 'Không tìm thấy phạm vi quyền phù hợp.'
    };

    return messages[errorCode] || fallback || 'Có lỗi xảy ra. Bạn thử lại giúp mình nhé.';
  }

  private resolveFieldName(field: string): string {
    const fields: Record<string, string> = {
      username: 'Tên đăng nhập',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu',
      fullName: 'Họ và tên',
      email: 'Email',
      phone: 'Số điện thoại',
      otp: 'OTP',
      siteKey: 'Kênh đăng ký'
    };

    return fields[field] || field;
  }

  private resolveFallbackMessage(status: number, fallback?: string): string {
    if (fallback) {
      return fallback;
    }

    switch (status) {
      case 0:
        return 'Không kết nối được tới server. Bạn kiểm tra backend hoặc mạng nhé.';
      case 400:
        return 'Thông tin gửi lên chưa hợp lệ. Bạn kiểm tra lại nhé.';
      case 401:
        return 'Bạn cần đăng nhập để tiếp tục thao tác này.';
      case 403:
        return 'Bạn chưa có quyền truy cập tài nguyên này.';
      case 404:
        return 'Không tìm thấy dữ liệu cần thao tác.';
      case 409:
        return 'Dữ liệu đang bị trùng hoặc xung đột.';
      case 429:
        return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.';
      case 500:
        return 'Hệ thống đang gặp sự cố. Bạn thử lại sau nhé.';
      default:
        return 'Có lỗi xảy ra. Bạn thử lại giúp mình nhé.';
    }
  }
}
