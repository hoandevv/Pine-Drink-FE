import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { TokenService } from '../services/token.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly publicGetPaths = [
    '/api/v1/products',
    '/api/v1/categories',
    '/api/v1/toppings',
    '/api/v1/branches/active',
    '/api/v1/vouchers/customer/available'
  ];

  constructor(private readonly tokenService: TokenService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.tokenService.getAccessToken();

    if (!token || request.headers.has('Authorization') || this.isPublicGetRequest(request)) {
      return next.handle(request);
    }

    return next.handle(
      request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    );
  }

  private isPublicGetRequest(request: HttpRequest<unknown>): boolean {
    if (request.method !== 'GET') {
      return false;
    }

    return this.publicGetPaths.some((path) => request.url.includes(path));
  }
}
