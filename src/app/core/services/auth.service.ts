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
import { AuthUser } from '../../shared/models/user.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { TokenService } from './token.service';

interface PermissionCacheEntry {
  userId: string;
  permissions: string[];
  loadedAt: number;
}

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

export interface SetPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface FileUploadResponseData {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

/**
 * Quản lý toàn bộ luồng xác thực phía FE.
 *
 * Bao gồm đăng ký, OTP, đăng nhập, Google login, refresh token,
 * logout, profile, password, upload avatar và permission hiện tại.
 *
 * Service này giữ user hiện tại bằng BehaviorSubject trong memory.
 * Token được quản lý riêng bởi TokenService.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authBaseUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.auth.base}`;
  private readonly permissionCacheKey = 'pine_drink_permissions_cache';
  private readonly permissionCacheTtlMs = 5 * 60 * 1000;
  // Khởi tạo user sơ bộ từ JWT, permission sẽ được nạp vào RAM từ cache/backend.
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.tokenService.getCurrentUserFromToken());
  private authorizationLoaded = false;
  private authorizationLoadRequest$?: Observable<AuthUser | null>;
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService
  ) {}

  /**
   * Gửi yêu cầu đăng ký tài khoản mới.
   */
  register(request: RegisterRequest): Observable<RegisterResponseData> {
    return this.http
      .post<BaseResponse<RegisterResponseData>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.register}`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Xác thực OTP cho luồng đăng ký tài khoản.
   */
  verifyRegistrationOtp(request: VerifyRegisterOtpRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.verifyRegisterOtp}`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Gửi lại OTP đăng ký.
   */
  resendRegistrationOtp(request: ResendRegisterOtpRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.resendRegisterOtp}`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Đăng nhập bằng username/password.
   *
   * Sau khi thành công, service lưu access/refresh token, cập nhật user hiện tại,
   * rồi tải permission mới nhất từ backend/Redis.
   *
   * @param request Username và password.
   * @returns Observable chứa dữ liệu đăng nhập từ backend.
   */
  login(request: LoginRequest): Observable<LoginResponseData> {
    return this.http.post<BaseResponse<LoginResponseData>>(`${this.authBaseUrl}/login`, request).pipe(
      tap((response) => {
        this.tokenService.setTokens(response.data.accessToken, response.data.refreshToken);
        this.setAuthenticatedUser(response.data.account);
      }),
      switchMap((response) => this.loadCurrentPermissions(true).pipe(
        map(() => response.data)
      ))
    );
  }

  /**
   * Đăng nhập bằng Google ID token.
   *
   * Sau khi thành công, service lưu token hệ thống, cập nhật user hiện tại,
   * rồi tải permission mới nhất từ backend/Redis.
   *
   * @param idToken Google credential token lấy từ Google Identity Services.
   * @returns Observable chứa dữ liệu đăng nhập từ backend.
   */
  googleLogin(idToken: string): Observable<LoginResponseData> {
    return this.http
      .post<BaseResponse<LoginResponseData>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.google}`, { idToken })
      .pipe(
        tap((response) => {
          this.tokenService.setTokens(response.data.accessToken, response.data.refreshToken);
          this.setAuthenticatedUser(response.data.account);
        }),
        switchMap((response) => this.loadCurrentPermissions(true).pipe(
          map(() => response.data)
        ))
      );
  }

  /**
   * Làm mới access token bằng refresh token hiện tại.
   *
   * @returns Observable chứa cặp token mới từ backend.
   */
  refreshToken(): Observable<RefreshTokenResponseData> {
    const refreshToken = this.tokenService.getRefreshToken();

    return this.http
      .post<BaseResponse<RefreshTokenResponseData>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.refreshToken}`, { refreshToken })
      .pipe(
        tap((response) => this.tokenService.setTokens(response.data.accessToken, response.data.refreshToken)),
        map((response) => response.data)
      );
  }

  /**
   * Đăng xuất tài khoản hiện tại.
   *
   * Gửi refresh token cho backend để revoke nếu có, sau đó xóa token local
   * và reset currentUser trong memory.
   */
  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();

    if (refreshToken) {
      this.http
        .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.logout}`, { refreshToken })
        .subscribe({ error: () => undefined });
    }

    this.tokenService.clearTokens();
    sessionStorage.removeItem(this.permissionCacheKey);
    this.authorizationLoaded = false;
    this.authorizationLoadRequest$ = undefined;
    this.currentUserSubject.next(null);
  }

  /**
   * Lấy profile tài khoản đang đăng nhập.
   *
   * Profile response có thể không chứa roles/permissions, nên setAuthenticatedUser()
   * sẽ merge với user/token hiện có để không mất quyền admin.
   *
   * @returns Observable chứa AuthUser đã đồng bộ permission hiện tại.
   */
  getProfile(): Observable<AuthUser> {
    return this.http
      .get<BaseResponse<AuthUser>>(`${environment.apiBaseUrl}${API_ENDPOINTS.profile.base}`)
      .pipe(
        tap((response) => this.setAuthenticatedUser(response.data)),
        map((response) => response.data)
      );
  }

  /**
   * Khởi tạo currentUser khi app reload.
   *
   * Đọc user sơ bộ từ JWT trước để guard/menu có dữ liệu ngay,
   * sau đó gọi profile thật từ backend. Nếu profile lỗi, giữ user từ token.
   *
   * @returns Observable chứa user hiện tại hoặc null nếu chưa đăng nhập.
   */
  bootstrapCurrentUser(): Observable<AuthUser | null> {
    return this.ensureAuthorizationLoaded();
  }

  /**
   * Đảm bảo role/permission hiện tại đã được backend xác thực.
   *
   * sessionStorage chỉ lưu bản cache tham khảo. Route/menu chỉ dùng dữ liệu trong RAM
   * sau khi profile và permission được backend trả về.
   */
  ensureAuthorizationLoaded(): Observable<AuthUser | null> {
    if (!this.tokenService.getAccessToken()) {
      this.authorizationLoaded = false;
      this.authorizationLoadRequest$ = undefined;
      this.currentUserSubject.next(null);
      return of(null);
    }

    const currentUser = this.currentUserSubject.value;
    if (this.authorizationLoaded && currentUser) {
      return of(currentUser);
    }

    if (this.authorizationLoadRequest$) {
      return this.authorizationLoadRequest$;
    }

    const tokenUser = this.tokenService.getCurrentUserFromToken();
    if (!currentUser) {
      this.currentUserSubject.next(tokenUser);
    }

    this.restorePermissionCacheToMemory();

    this.authorizationLoadRequest$ = this.getProfile().pipe(
      switchMap((user) => this.loadCurrentPermissions().pipe(
        map(() => this.getCurrentUser() ?? user)
      )),
      tap(() => this.authorizationLoaded = true),
      catchError(() => {
        this.authorizationLoaded = false;
        this.currentUserSubject.next(null);
        return of(null);
      }),
      finalize(() => this.authorizationLoadRequest$ = undefined),
      shareReplay(1)
    );

    return this.authorizationLoadRequest$;
  }

  /**
   * Tải danh sách permission hiện tại từ backend.
   *
   * Backend là nguồn sự thật; permission thường được backend lấy từ Redis/cache.
   * FE ưu tiên permission trong RAM, sau đó sessionStorage cache còn hạn.
   * Nếu không có cache hợp lệ thì gọi backend lấy permission mới.
   *
   * @param forceRefresh Bỏ qua cache FE và gọi backend ngay.
   * @returns Observable chứa danh sách permission code dạng string.
   */
  loadCurrentPermissions(forceRefresh = false): Observable<string[]> {
    if (!this.tokenService.getAccessToken()) {
      return of([]);
    }

    const cachedPermissions = this.getCachedPermissions();
    if (!forceRefresh && cachedPermissions) {
      return of(cachedPermissions);
    }

    return this.http
      .get<BaseResponse<string[]>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.permissions}`)
      .pipe(
        map((response) => response.data ?? []),
        tap((permissions) => this.mergePermissions(permissions))
      );
  }

  /**
   * Gửi yêu cầu quên mật khẩu.
   *
   * @param request Email/tài khoản cần đặt lại mật khẩu.
   * @returns Observable hoàn tất khi OTP reset được gửi.
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.forgotPassword}`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Xác thực OTP quên mật khẩu.
   *
   * @param request Thông tin OTP reset password.
   * @returns Observable chứa reset token hoặc dữ liệu xác thực OTP từ backend.
   */
  verifyForgotPasswordOtp(request: VerifyForgotPasswordOtpRequest): Observable<ForgotPasswordOtpResponseData> {
    return this.http
      .post<BaseResponse<ForgotPasswordOtpResponseData>>(
        `${environment.apiBaseUrl}${API_ENDPOINTS.auth.verifyForgotPasswordOtp}`,
        request
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Đặt lại mật khẩu bằng reset token.
   *
   * @param request Mật khẩu mới và xác nhận mật khẩu.
   * @param resetToken Token reset password do backend cấp sau khi xác thực OTP.
   * @returns Observable hoàn tất khi đổi mật khẩu thành công.
   */
  resetPassword(request: ResetPasswordRequest, resetToken: string): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.auth.resetPassword}`, request, {
        headers: { Authorization: `Bearer ${resetToken}` }
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Cập nhật profile tài khoản đang đăng nhập.
   *
   * @param request Các trường profile cần cập nhật.
   * @returns Observable chứa AuthUser mới từ backend.
   */
  updateProfile(request: UpdateProfileRequest): Observable<AuthUser> {
    return this.http
      .put<BaseResponse<AuthUser>>(`${environment.apiBaseUrl}${API_ENDPOINTS.profile.base}`, request)
      .pipe(
        tap((response) => this.setAuthenticatedUser(response.data)),
        map((response) => response.data)
      );
  }

  /**
   * Đổi mật khẩu local bằng mật khẩu hiện tại.
   *
   * @param request Mật khẩu hiện tại, mật khẩu mới và xác nhận.
   * @returns Observable hoàn tất khi đổi mật khẩu thành công.
   */
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http
      .put<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.profile.password}`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Tạo mật khẩu local cho tài khoản chưa có mật khẩu.
   *
   * Thường dùng cho tài khoản đăng ký/đăng nhập bằng Google.
   *
   * @param request Mật khẩu mới và xác nhận.
   * @returns Observable hoàn tất khi tạo mật khẩu thành công.
   */
  setPassword(request: SetPasswordRequest): Observable<void> {
    return this.http
      .post<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.profile.setPassword}`, request)
      .pipe(map((response) => response.data));
  }

  /**
   * Upload ảnh đại diện của user hiện tại.currentUser 
   *
   * @param file File ảnh cần upload.
   * @returns Observable chứa thông tin file đã lưu.
   */
  uploadAvatar(file: File): Observable<FileUploadResponseData> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<BaseResponse<FileUploadResponseData>>(`${environment.apiBaseUrl}${API_ENDPOINTS.profile.avatar}`, formData)
      .pipe(map((response) => response.data));
  }

  /**
   * Cập nhật currentUser trong memory.
   *
   * Hàm này merge roles/permissions thay vì ghi đè mù, vì một số API profile
   * không trả roles hoặc permissions. Roles được ưu tiên từ response, sau đó
   * user hiện tại, cuối cùng là JWT.
   *
   * @param user User mới nhận từ backend.
   */
  private setAuthenticatedUser(user: AuthUser): void {
    const currentUser = this.currentUserSubject.value;
    const nextUser: AuthUser = {
      ...user,
      roles: user.roles ?? currentUser?.roles ?? [],
      permissions: user.permissions?.length ? user.permissions : currentUser?.permissions ?? []
    };

    this.currentUserSubject.next(nextUser);
  }

  /**
   * Gắn danh sách permission mới vào currentUser.
   *
   * @param permissions Danh sách permission code lấy từ backend.
   */
  private mergePermissions(permissions: string[]): void {
    const user = this.currentUserSubject.value ?? this.tokenService.getCurrentUserFromToken();
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

  /**
   * Lấy permission cache theo thứ tự:
   * 1. RAM hiện tại.
   * 2. sessionStorage nếu cache đúng user và còn hạn.
   *
   * @returns Danh sách permission cache, hoặc null nếu không có cache hợp lệ.
   */
  private getCachedPermissions(): string[] | null {
    const user = this.currentUserSubject.value;
    if (user?.permissions?.length) {
      return user.permissions;
    }

    return this.getValidSessionPermissionCache(user)?.permissions ?? null;
  }

  /**
   * Nạp permission cache từ sessionStorage vào RAM để route/menu có dữ liệu nhanh sau F5.
   */
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
    if (!user?.id) {
      return null;
    }

    const rawCache = sessionStorage.getItem(this.permissionCacheKey);
    if (!rawCache) {
      return null;
    }

    try {
      const cacheEntry = JSON.parse(rawCache) as PermissionCacheEntry;
      const isSameUser = cacheEntry.userId === user.id;
      const hasPermissions = Array.isArray(cacheEntry.permissions) && cacheEntry.permissions.length > 0;
      const isFresh = Date.now() - cacheEntry.loadedAt <= this.permissionCacheTtlMs;

      if (isSameUser && hasPermissions && isFresh) {
        return cacheEntry;
      }
    } catch {
      // Cache lỗi format thì bỏ, tránh làm hỏng luồng đăng nhập.
    }

    sessionStorage.removeItem(this.permissionCacheKey);
    return null;
  }

  private storePermissionCache(user: AuthUser): void {
    if (!user.id || !user.permissions?.length || !user.permissionsLoadedAt) {
      return;
    }

    const cacheEntry: PermissionCacheEntry = {
      userId: user.id,
      permissions: user.permissions,
      loadedAt: user.permissionsLoadedAt
    };

    sessionStorage.setItem(this.permissionCacheKey, JSON.stringify(cacheEntry));
  }

  /**
   * Lấy user hiện tại đang lưu trong memory.
   *
   * @returns AuthUser hiện tại hoặc null nếu chưa đăng nhập.
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Kiểm tra trạng thái đăng nhập dựa trên access token hợp lệ.
   *
   * @returns true nếu có access token và token chưa hết hạn.
   */
  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }
}
