import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { map, Observable } from 'rxjs';

import { AccessControlService } from '../services/access-control.service';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

type GuardResult = boolean | UrlTree;
type AsyncGuardResult = GuardResult | Observable<GuardResult>;

/**
 * Guard bảo vệ route:
 * - Kiểm tra đăng nhập
 * - Kiểm tra role
 * - Kiểm tra permission
 * - Ngăn user đã đăng nhập truy cập trang login
 */
@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly tokenService: TokenService,
    private readonly router: Router,
    private readonly accessControlService: AccessControlService,
    private readonly authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): AsyncGuardResult {
    if (this.isGuestOnlyRoute(route)) {
      return this.checkGuestOnlyRoute(route);
    }

    return this.checkProtectedRoute(route, state.url);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): AsyncGuardResult {
    return this.checkProtectedRoute(route, state.url);
  }

  /**
   * Kiểm tra route yêu cầu đăng nhập.
   */
  private checkProtectedRoute(
    route: ActivatedRouteSnapshot,
    redirectUrl: string
  ): AsyncGuardResult {
    if (!this.tokenService.isLoggedIn()) {
      return this.redirectToLogin(redirectUrl);
    }

    return this.authService.ensureAuthorizationLoaded().pipe(
      map(user => {
        if (!user) {
          return this.redirectToLogin(redirectUrl);
        }

        if (!this.hasRouteAccess(route)) {
          return this.redirectToHome();
        }

        if (!this.canAccessAdminRoute(route, redirectUrl)) {
          return this.redirectToHome();
        }

        return true;
      })
    );
  }

  /**
   * Kiểm tra user có quyền truy cập route hay không.
   */
  private hasRouteAccess(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = this.getRequiredPermission(route);
    const requiredPermissions = this.getRequiredPermissions(route);
    const requiredRoles = this.getRequiredRoles(route);

    if (
      requiredPermission &&
      !this.accessControlService.can(requiredPermission)
    ) {
      return false;
    }

    if (
      requiredPermissions.length > 0 &&
      !this.accessControlService.canAny(requiredPermissions)
    ) {
      return false;
    }

    if (
      requiredRoles.length > 0 &&
      !this.accessControlService.hasAnyRole(requiredRoles)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Kiểm tra quyền truy cập khu vực admin.
   *
   * Nếu route admin không khai báo role hoặc permission cụ thể,
   * user vẫn phải là người được phép sử dụng admin console.
   */
  private canAccessAdminRoute(
    route: ActivatedRouteSnapshot,
    url: string
  ): boolean {
    if (!url.startsWith('/admin')) {
      return true;
    }

    if (this.routeHasAuthorizationConfig(route)) {
      return true;
    }

    return this.accessControlService.isAdminConsoleUser();
  }

  /**
   * Xử lý route chỉ dành cho khách chưa đăng nhập,
   * ví dụ trang login hoặc register.
   */
  private checkGuestOnlyRoute(
    route: ActivatedRouteSnapshot
  ): AsyncGuardResult {
    if (!this.tokenService.isLoggedIn()) {
      return true;
    }

    const redirectUrl = route.queryParamMap.get('redirectUrl');

    if (this.isValidRedirectUrl(redirectUrl)) {
      return this.router.parseUrl(redirectUrl);
    }

    return this.authService.ensureAuthorizationLoaded().pipe(
      map(() => this.redirectAfterLogin())
    );
  }

  /**
   * Chuyển hướng sau khi user đã đăng nhập.
   */
  private redirectAfterLogin(): UrlTree {
    if (this.accessControlService.isAdminConsoleUser()) {
      return this.router.createUrlTree(['/admin/dashboard']);
    }

    return this.redirectToHome();
  }

  private isGuestOnlyRoute(route: ActivatedRouteSnapshot): boolean {
    return route.data['guestOnly'] === true;
  }

  private routeHasAuthorizationConfig(
    route: ActivatedRouteSnapshot
  ): boolean {
    const permission = this.getRequiredPermission(route);
    const permissions = this.getRequiredPermissions(route);
    const roles = this.getRequiredRoles(route);

    return Boolean(
      permission ||
      permissions.length > 0 ||
      roles.length > 0
    );
  }

  private getRequiredPermission(
    route: ActivatedRouteSnapshot
  ): string | undefined {
    return route.data['permission'] as string | undefined;
  }

  private getRequiredPermissions(
    route: ActivatedRouteSnapshot
  ): string[] {
    return (route.data['permissions'] as string[] | undefined) ?? [];
  }

  private getRequiredRoles(
    route: ActivatedRouteSnapshot
  ): string[] {
    return (route.data['roles'] as string[] | undefined) ?? [];
  }

  private isValidRedirectUrl(
    redirectUrl: string | null
  ): redirectUrl is string {
    return Boolean(
      redirectUrl &&
      !redirectUrl.startsWith('/auth')
    );
  }

  private redirectToLogin(redirectUrl: string): UrlTree {
    return this.router.createUrlTree(['/auth/login'], {
      queryParams: { redirectUrl }
    });
  }

  private redirectToHome(): UrlTree {
    return this.router.createUrlTree(['/']);
  }
}