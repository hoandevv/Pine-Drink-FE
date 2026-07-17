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

  /**
   * Method chính Angular gọi khi user truy cập 1 route.
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): AsyncGuardResult {
    const isGuestOnlyRoute = this.isGuestOnlyRoute(route);

    if (isGuestOnlyRoute) {
      return this.checkGuestOnlyRoute(route);
    } else {
      return this.checkProtectedRoute(route, state.url);
    }
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
    const isLoggedIn = this.tokenService.isLoggedIn();

    if (!isLoggedIn) {
      return this.redirectToLogin(redirectUrl);
    }

    return this.authService.ensureAuthorizationLoaded().pipe(
      map(user => {
        if (!user) {
          return this.redirectToLogin(redirectUrl);
        }

        const canAccessRoute = this.hasRouteAccess(route);

        if (!canAccessRoute) {
          return this.redirectToHome();
        }

        const canAccessAdminRoute = this.canAccessAdminRoute(route, redirectUrl);

        if (!canAccessAdminRoute) {
          return this.redirectToHome();
        }

        return true;
      })
    );
  }

  /**
   * Xử lý route chỉ dành cho khách chưa đăng nhập,
   * ví dụ trang login hoặc register.
   */
  private checkGuestOnlyRoute(
    route: ActivatedRouteSnapshot
  ): AsyncGuardResult {
    const isLoggedIn = this.tokenService.isLoggedIn();

    if (!isLoggedIn) {
      return true;
    }

    const redirectUrl = route.queryParamMap.get('redirectUrl');
    const hasValidRedirectUrl = this.isValidRedirectUrl(redirectUrl);

    if (hasValidRedirectUrl) {
      return this.router.parseUrl(redirectUrl);
    }

    return this.authService.ensureAuthorizationLoaded().pipe(
      map(() => {
        return this.redirectAfterLogin();
      })
    );
  }
  private hasRouteAccess(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = this.getRequiredPermission(route);
    const requiredPermissions = this.getRequiredPermissions(route);
    const requiredRoles = this.getRequiredRoles(route);

    if (requiredPermission) {
      const hasPermission = this.accessControlService.can(requiredPermission);

      if (!hasPermission) {
        return false;
      }
    }

    if (requiredPermissions.length > 0) {
      const hasOnePermission = this.accessControlService.canAny(requiredPermissions);

      if (!hasOnePermission) {
        return false;
      }
    }

    if (requiredRoles.length > 0) {
      const hasOneRole = this.accessControlService.hasAnyRole(requiredRoles);

      if (!hasOneRole) {
        return false;
      }
    }

    return true;
  }

  private canAccessAdminRoute(
    route: ActivatedRouteSnapshot,
    url: string
  ): boolean {
    const isAdminUrl = url.startsWith('/admin');

    if (!isAdminUrl) {
      return true;
    }

    const hasAuthorizationConfig = this.routeHasAuthorizationConfig(route);

    if (hasAuthorizationConfig) {
      return true;
    }

    return this.accessControlService.isAdminConsoleUser();
  }

  /**
   * Chuyển hướng sau khi user đã đăng nhập.
   */
  private redirectAfterLogin(): UrlTree {
    const isAdminConsoleUser = this.accessControlService.isAdminConsoleUser();

    if (isAdminConsoleUser) {
      return this.router.createUrlTree(['/admin/dashboard']);
    } else {
      return this.redirectToHome();
    }
  }

  /**
   * Kiểm tra route có được đánh dấu chỉ dành cho customer hay không.
   */
  private isGuestOnlyRoute(route: ActivatedRouteSnapshot): boolean {
    const guestOnly = route.data['guestOnly'];

    if (guestOnly === true) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Kiểm tra route có khai báo role hoặc permission hay không.
   */
  private routeHasAuthorizationConfig(
    route: ActivatedRouteSnapshot
  ): boolean {
    const permission = this.getRequiredPermission(route);
    const permissions = this.getRequiredPermissions(route);
    const roles = this.getRequiredRoles(route);

    if (permission) {
      return true;
    }

    if (permissions.length > 0) {
      return true;
    }

    if (roles.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Lấy 1 permission mà route yêu cầu.
   */
  private getRequiredPermission(
    route: ActivatedRouteSnapshot
  ): string | undefined {
    const permission = route.data['permission'] as string | undefined;

    if (permission) {
      return permission;
    } else {
      return undefined;
    }
  }

  /**
   * Lấy danh sách permission mà route yêu cầu.
   */
  private getRequiredPermissions(
    route: ActivatedRouteSnapshot
  ): string[] {
    const permissions = route.data['permissions'] as string[] | undefined;

    if (permissions) {
      return permissions;
    } else {
      return [];
    }
  }

  /**
   * Lấy danh sách role mà route yêu cầu.
   */
  private getRequiredRoles(
    route: ActivatedRouteSnapshot
  ): string[] {
    const roles = route.data['roles'] as string[] | undefined;

    if (roles) {
      return roles;
    } else {
      return [];
    }
  }

  /**
   * Kiểm tra redirect URL có hợp lệ không.
   */
  private isValidRedirectUrl(
    redirectUrl: string | null
  ): redirectUrl is string {
    if (!redirectUrl) {
      return false;
    }

    if (redirectUrl.startsWith('/auth')) {
      return false;
    }

    return true;
  }

  /**
   * Chuyển hướng về trang login.
   */
  private redirectToLogin(redirectUrl: string): UrlTree {
    return this.router.createUrlTree(['/auth/login'], {
      queryParams: { redirectUrl }
    });
  }

  /**
   * Chuyển hướng về trang chủ.
   */
  private redirectToHome(): UrlTree {
    return this.router.createUrlTree(['/']);
  }
}
