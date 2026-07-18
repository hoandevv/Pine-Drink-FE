import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, switchMap, tap } from 'rxjs';

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
import { AuthUser, ScopeAccess } from '../../shared/models/user.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import {
  ChangePasswordRequest,
  FileUploadResponseData,
  PermissionCacheEntry,
  SetPasswordRequest,
  UpdateProfileRequest
} from '../models/auth.model';
import { TokenService } from './token.service';

/**
 * Qu?n l? lu?ng x?c th?c ph?a FE.
 *
 * Service n?y ch? x? l? auth/profile/permission hi?n t?i.
 * Token ???c qu?n l? ri?ng b?i TokenService.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly permissionCacheKey = 'pine_drink_permissions_cache';
  private readonly permissionCacheTtlMs = 5 * 60 * 1000;

  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.tokenService.getCurrentUserFromToken());
  private authorizationLoaded = false;
  private authorizationLoadRequest?: Observable<AuthUser | null>;

  public readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService
  ) {}

  register(request: RegisterRequest): Observable<RegisterResponseData> {
    return this.http
      .post<BaseResponse<RegisterResponseData>>(this.getUrl(API_ENDPOINTS.auth.register), request)
      .pipe(map((response) => response.data));
  }

  verifyRegistrationOtp(request: VerifyRegisterOtpRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(this.getUrl(API_ENDPOINTS.auth.verifyRegisterOtp), request)
      .pipe(map((response) => response.data));
  }

  resendRegistrationOtp(request: ResendRegisterOtpRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(this.getUrl(API_ENDPOINTS.auth.resendRegisterOtp), request)
      .pipe(map((response) => response.data));
  }

  login(request: LoginRequest): Observable<LoginResponseData> {
    return this.http
      .post<BaseResponse<LoginResponseData>>(this.getUrl(API_ENDPOINTS.auth.login), request)
      .pipe(switchMap((response) => this.handleLoginSuccess(response.data)));
  }

  googleLogin(idToken: string): Observable<LoginResponseData> {
    const body = { idToken };

    return this.http
      .post<BaseResponse<LoginResponseData>>(this.getUrl(API_ENDPOINTS.auth.google), body)
      .pipe(switchMap((response) => this.handleLoginSuccess(response.data)));
  }

  refreshToken(): Observable<RefreshTokenResponseData> {
    const body = { refreshToken: this.tokenService.getRefreshToken() };

    return this.http
      .post<BaseResponse<RefreshTokenResponseData>>(this.getUrl(API_ENDPOINTS.auth.refreshToken), body)
      .pipe(
        tap((response) => this.tokenService.setTokens(response.data.accessToken, response.data.refreshToken)),
        map((response) => response.data)
      );
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();

    if (refreshToken) {
      this.http
        .post<BaseResponse<void>>(this.getUrl(API_ENDPOINTS.auth.logout), { refreshToken })
        .subscribe({ error: () => undefined });
    }

    this.clearAuthState();
  }

  getProfile(): Observable<AuthUser> {
    return this.http
      .get<BaseResponse<AuthUser>>(this.getUrl(API_ENDPOINTS.profile.base))
      .pipe(
        tap((response) => this.setAuthenticatedUser(response.data)),
        map((response) => response.data)
      );
  }

  bootstrapCurrentUser(): Observable<AuthUser | null> {
    return this.ensureAuthorizationLoaded();
  }

  ensureAuthorizationLoaded(): Observable<AuthUser | null> {
    if (!this.tokenService.getAccessToken()) {
      this.clearAuthState();
      return of(null);
    }

    const currentUser = this.currentUserSubject.value;
    if (this.authorizationLoaded && currentUser) {
      return of(currentUser);
    }

    if (this.authorizationLoadRequest) {
      return this.authorizationLoadRequest;
    }

    this.restoreUserFromTokenIfNeeded();
    this.restorePermissionCacheToMemory();

    this.authorizationLoadRequest = this.getProfile().pipe(
      switchMap((user) => this.loadCurrentPermissions().pipe(map(() => this.getCurrentUser() || user))),
      tap(() => this.authorizationLoaded = true),
      catchError(() => {
        this.clearAuthState();
        return of(null);
      }),
      finalize(() => this.authorizationLoadRequest = undefined),
      shareReplay(1)
    );

    return this.authorizationLoadRequest;
  }

  loadCurrentPermissions(forceRefresh = false): Observable<string[]> {
    if (!this.tokenService.getAccessToken()) {
      return of([]);
    }

    const cachedPermissions = this.getCachedPermissions();
    if (!forceRefresh && cachedPermissions) {
      return of(cachedPermissions);
    }

    return this.http
      .get<BaseResponse<string[]>>(this.getUrl(API_ENDPOINTS.auth.permissions))
      .pipe(
        map((response) => response.data || []),
        tap((permissions) => this.mergePermissions(permissions))
      );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(this.getUrl(API_ENDPOINTS.auth.forgotPassword), request)
      .pipe(map((response) => response.data));
  }

  verifyForgotPasswordOtp(request: VerifyForgotPasswordOtpRequest): Observable<ForgotPasswordOtpResponseData> {
    return this.http
      .post<BaseResponse<ForgotPasswordOtpResponseData>>(this.getUrl(API_ENDPOINTS.auth.verifyForgotPasswordOtp), request)
      .pipe(map((response) => response.data));
  }

  resetPassword(request: ResetPasswordRequest, resetToken: string): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(this.getUrl(API_ENDPOINTS.auth.resetPassword), request, {
        headers: { Authorization: `Bearer ${resetToken}` }
      })
      .pipe(map((response) => response.data));
  }

  updateProfile(request: UpdateProfileRequest): Observable<AuthUser> {
    return this.http
      .put<BaseResponse<AuthUser>>(this.getUrl(API_ENDPOINTS.profile.base), request)
      .pipe(
        tap((response) => this.setAuthenticatedUser(response.data)),
        map((response) => response.data)
      );
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http
      .put<BaseResponse<void>>(this.getUrl(API_ENDPOINTS.profile.password), request)
      .pipe(map((response) => response.data));
  }

  setPassword(request: SetPasswordRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(this.getUrl(API_ENDPOINTS.profile.setPassword), request)
      .pipe(map((response) => response.data));
  }

  uploadAvatar(file: File): Observable<FileUploadResponseData> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<BaseResponse<FileUploadResponseData>>(this.getUrl(API_ENDPOINTS.profile.avatar), formData)
      .pipe(map((response) => response.data));
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }

  private getUrl(endpoint: string): string {
    return `${environment.apiBaseUrl}${endpoint}`;
  }

  private handleLoginSuccess(loginData: LoginResponseData): Observable<LoginResponseData> {
    this.tokenService.setTokens(loginData.accessToken, loginData.refreshToken);
    this.setAuthenticatedUser(loginData.account);

    return this.loadCurrentPermissions(true).pipe(map(() => loginData));
  }

  private clearAuthState(): void {
    this.tokenService.clearTokens();
    sessionStorage.removeItem(this.permissionCacheKey);
    this.authorizationLoaded = false;
    this.authorizationLoadRequest = undefined;
    this.currentUserSubject.next(null);
  }

  private restoreUserFromTokenIfNeeded(): void {
    const currentUser = this.currentUserSubject.value;

    if (currentUser) {
      return;
    }

    this.currentUserSubject.next(this.tokenService.getCurrentUserFromToken());
  }

  private setAuthenticatedUser(user: AuthUser): void {
    const currentUser = this.currentUserSubject.value;
    const tokenUser = this.tokenService.getCurrentUserFromToken();

    const authenticatedUser: AuthUser = {
      ...user,
      roles: this.getAvailableRoles(user, currentUser, tokenUser),
      scope: this.getAvailableScope(user, currentUser, tokenUser),
      permissions: this.getAvailablePermissions(user, currentUser)
    };

    this.currentUserSubject.next(authenticatedUser);
  }

  private getAvailableRoles(user: AuthUser, currentUser: AuthUser | null, tokenUser: AuthUser | null): string[] {
    if (user.roles) {
      return user.roles;
    }

    if (currentUser && currentUser.roles) {
      return currentUser.roles;
    }

    if (tokenUser && tokenUser.roles) {
      return tokenUser.roles;
    }

    return [];
  }

  private getAvailableScope(
    user: AuthUser,
    currentUser: AuthUser | null,
    tokenUser: AuthUser | null
  ): ScopeAccess | null | undefined {
    if (user.scope) {
      return user.scope;
    }

    if (currentUser && currentUser.scope) {
      return currentUser.scope;
    }

    if (tokenUser && tokenUser.scope) {
      return tokenUser.scope;
    }

    return user.scope;
  }

  private getAvailablePermissions(user: AuthUser, currentUser: AuthUser | null): string[] {
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions;
    }

    if (currentUser && currentUser.permissions) {
      return currentUser.permissions;
    }

    return [];
  }

  private mergePermissions(permissions: string[]): void {
    const user = this.currentUserSubject.value || this.tokenService.getCurrentUserFromToken();

    if (!user) {
      return;
    }

    const nextUser: AuthUser = {
      ...user,
      permissions,
      permissionsLoadedAt: Date.now()
    };

    this.currentUserSubject.next(nextUser);
    this.storePermissionCache(nextUser);
  }

  private getCachedPermissions(): string[] | null {
    const user = this.currentUserSubject.value;

    if (user && user.permissions && user.permissions.length > 0) {
      return user.permissions;
    }

    const cacheEntry = this.getValidSessionPermissionCache(user);
    if (cacheEntry) {
      return cacheEntry.permissions;
    }

    return null;
  }

  private restorePermissionCacheToMemory(): void {
    const user = this.currentUserSubject.value;
    const cacheEntry = this.getValidSessionPermissionCache(user);

    if (!user || !cacheEntry) {
      return;
    }

    this.currentUserSubject.next({
      ...user,
      permissions: cacheEntry.permissions,
      permissionsLoadedAt: cacheEntry.loadedAt
    });
  }

  private getValidSessionPermissionCache(user: AuthUser | null): PermissionCacheEntry | null {
    if (!user || !user.id) {
      return null;
    }

    const rawCache = sessionStorage.getItem(this.permissionCacheKey);
    if (!rawCache) {
      return null;
    }

    try {
      const cacheEntry = JSON.parse(rawCache) as PermissionCacheEntry;

      if (this.isValidPermissionCache(user, cacheEntry)) {
        return cacheEntry;
      }
    } catch {
      // Cache l?i format th? b?, tr?nh l?m h?ng lu?ng ??ng nh?p.
    }

    sessionStorage.removeItem(this.permissionCacheKey);
    return null;
  }

  private isValidPermissionCache(user: AuthUser, cacheEntry: PermissionCacheEntry): boolean {
    const isSameUser = cacheEntry.userId === user.id;
    const hasPermissions = Array.isArray(cacheEntry.permissions) && cacheEntry.permissions.length > 0;
    const isFresh = Date.now() - cacheEntry.loadedAt <= this.permissionCacheTtlMs;

    return isSameUser && hasPermissions && isFresh;
  }

  private storePermissionCache(user: AuthUser): void {
    if (!user.id || !user.permissions || user.permissions.length === 0 || !user.permissionsLoadedAt) {
      return;
    }

    const cacheEntry: PermissionCacheEntry = {
      userId: user.id,
      permissions: user.permissions,
      loadedAt: user.permissionsLoadedAt
    };

    sessionStorage.setItem(this.permissionCacheKey, JSON.stringify(cacheEntry));
  }
}
