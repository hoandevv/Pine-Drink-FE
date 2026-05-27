import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ForgotPasswordOtpResponseData,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyForgotPasswordOtpRequest
} from '../../features/auth/models/forgot-password.model';
import { LoginRequest } from '../../features/auth/models/login-request.model';
import { LoginResponseData } from '../../features/auth/models/login-response.model';
import { RefreshTokenResponseData } from '../../features/auth/models/refresh-token.model';
import {
  RegisterRequest,
  RegisterResponseData,
  ResendRegisterOtpRequest,
  VerifyRegisterOtpRequest
} from '../../features/auth/models/register.model';
import { BaseResponse } from '../../shared/models/base-response.model';
import { AuthUser } from '../../shared/models/user.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { TokenService } from './token.service';

export interface UpdateProfileRequest {
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface FileUploadResponseData {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authBaseUrl = `${environment.apiBaseUrl}/auth`;
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.tokenService.getCurrentUserFromToken());
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService
  ) {}

  register(request: RegisterRequest): Observable<RegisterResponseData> {
    return this.http
      .post<BaseResponse<RegisterResponseData>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.register}`, request)
      .pipe(map((response) => response.data));
  }

  verifyRegistrationOtp(request: VerifyRegisterOtpRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.verifyRegisterOtp}`, request)
      .pipe(map((response) => response.data));
  }

  resendRegistrationOtp(request: ResendRegisterOtpRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.resendRegisterOtp}`, request)
      .pipe(map((response) => response.data));
  }

  login(request: LoginRequest): Observable<LoginResponseData> {
    return this.http.post<BaseResponse<LoginResponseData>>(`${this.authBaseUrl}/login`, request).pipe(
      tap((response) => {
        this.tokenService.setTokens(response.data.accessToken, response.data.refreshToken);
        this.tokenService.setCurrentUser(response.data.account);
        this.currentUserSubject.next(response.data.account);
      }),
      map((response) => response.data)
    );
  }

  refreshToken(): Observable<RefreshTokenResponseData> {
    const refreshToken = this.tokenService.getRefreshToken();

    return this.http
      .post<BaseResponse<RefreshTokenResponseData>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.refreshToken}`, { refreshToken })
      .pipe(
        tap((response) => this.tokenService.setTokens(response.data.accessToken, response.data.refreshToken)),
        map((response) => response.data)
      );
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();

    if (refreshToken) {
      this.http
        .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.logout}`, { refreshToken })
        .subscribe({ error: () => undefined });
    }

    this.tokenService.clearTokens();
    this.currentUserSubject.next(null);
  }

  getProfile(): Observable<AuthUser> {
    return this.http
      .get<BaseResponse<AuthUser>>(`${environment.apiBaseUrl}${API_ENDPOINTS.profile.base}`)
      .pipe(
        tap((response) => this.setAuthenticatedUser(response.data)),
        map((response) => response.data)
      );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.forgotPassword}`, request)
      .pipe(map((response) => response.data));
  }

  verifyForgotPasswordOtp(request: VerifyForgotPasswordOtpRequest): Observable<ForgotPasswordOtpResponseData> {
    return this.http
      .post<BaseResponse<ForgotPasswordOtpResponseData>>(
        `${environment.apiBaseUrl}${API_ENDPOINTS.auth.verifyForgotPasswordOtp}`,
        request
      )
      .pipe(map((response) => response.data));
  }

  resetPassword(request: ResetPasswordRequest, resetToken: string): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.resetPassword}`, request, {
        headers: { Authorization: `Bearer ${resetToken}` }
      })
      .pipe(map((response) => response.data));
  }

  updateProfile(request: UpdateProfileRequest): Observable<AuthUser> {
    return this.http
      .put<BaseResponse<AuthUser>>(`${environment.apiBaseUrl}${API_ENDPOINTS.profile.base}`, request)
      .pipe(
        tap((response) => this.setAuthenticatedUser(response.data)),
        map((response) => response.data)
      );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http
      .put<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.profile.password}`, request)
      .pipe(map((response) => response.data));
  }

  uploadAvatar(file: File): Observable<FileUploadResponseData> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<BaseResponse<FileUploadResponseData>>(`${environment.apiBaseUrl}${API_ENDPOINTS.profile.avatar}`, formData)
      .pipe(map((response) => response.data));
  }

  private setAuthenticatedUser(user: AuthUser): void {
    this.tokenService.setCurrentUser(user);
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }
}
