import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authBaseUrl = `${environment.apiBaseUrl}/auth`;

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
  }

  getProfile(): Observable<AuthUser> {
    return this.http
      .get<BaseResponse<AuthUser>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.me}`)
      .pipe(
        tap((response) => this.tokenService.setCurrentUser(response.data)),
        map((response) => response.data)
      );
  }

  getCurrentUser(): AuthUser | null {
    return this.tokenService.getCurrentUserFromToken();
  }

  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }
}
