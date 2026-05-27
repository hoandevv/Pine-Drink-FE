import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { TokenService } from '../services/token.service';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly tokenService: TokenService,
    private readonly router: Router
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAuth(state.url);
  }

  canActivateChild(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
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
}
