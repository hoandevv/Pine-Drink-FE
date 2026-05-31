import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { TokenService } from '../services/token.service';
import { AccessControlService } from '../services/access-control.service';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly tokenService: TokenService,
    private readonly router: Router,
    private readonly accessControl: AccessControlService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (route.data['guestOnly']) {
      return this.checkGuestOnly(route);
    }

    return this.checkAuth(state.url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAuth(state.url, route);
  }

  private checkAuth(redirectUrl: string, route?: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.tokenService.isLoggedIn()) {
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: { redirectUrl }
      });
    }

    const permission = route?.data?.['permission'] as string | undefined;
    if (permission && !this.accessControl.can(permission)) {
      return this.router.createUrlTree(['/']);
    }

    if (redirectUrl.startsWith('/admin') && !permission && !this.accessControl.isAdminConsoleUser()) {
      return this.router.createUrlTree(['/']);
    }

    return true;
  }

  private checkGuestOnly(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.tokenService.isLoggedIn()) {
      return true;
    }

    const requestedRedirect = route.queryParamMap.get('redirectUrl');
    if (requestedRedirect && !requestedRedirect.startsWith('/auth')) {
      return this.router.parseUrl(requestedRedirect);
    }

    return this.router.createUrlTree([this.accessControl.isAdminConsoleUser() ? '/admin/dashboard' : '/']);
  }

}
