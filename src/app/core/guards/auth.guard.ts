import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { TokenService } from '../services/token.service';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly tokenService: TokenService,
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (route.data['guestOnly']) {
      return this.checkGuestOnly(route);
    }

    return this.checkAuth(state.url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAuth(state.url);
  }

  private checkAuth(redirectUrl: string): boolean | UrlTree {
    if (this.tokenService.isLoggedIn()) {
      return true;
    }

    return this.router.createUrlTree(['/auth/login'], {
      queryParams: { redirectUrl }
    });
  }

  private checkGuestOnly(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.tokenService.isLoggedIn()) {
      return true;
    }

    const requestedRedirect = route.queryParamMap.get('redirectUrl');
    if (requestedRedirect && !requestedRedirect.startsWith('/auth')) {
      return this.router.parseUrl(requestedRedirect);
    }

    return this.router.createUrlTree([this.isAdminUser() ? '/admin/dashboard' : '/']);
  }

  private isAdminUser(): boolean {
    const roles = this.tokenService.getCurrentUserFromToken()?.roles ?? [];
    return roles.some((role) => ['ADMIN', 'ROLE_ADMIN'].includes(role.toUpperCase()));
  }
}
