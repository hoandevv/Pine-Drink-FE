import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest } from '../../features/auth/models/login-request.model';
import { LoginResponseData } from '../../features/auth/models/login-response.model';
import { BaseResponse } from '../../shared/models/base-response.model';
import { AuthUser } from '../../shared/models/user.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.auth.login}`;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService
  ) {}

  login(request: LoginRequest): Observable<LoginResponseData> {
    return this.http.post<BaseResponse<LoginResponseData>>(this.apiUrl, request).pipe(
      tap((response) => {
        this.tokenService.setTokens(response.data.accessToken, response.data.refreshToken);
        this.tokenService.setCurrentUser(response.data.user);
      }),
      map((response) => response.data)
    );
  }

  logout(): void {
    this.tokenService.clearTokens();
  }

  getCurrentUser(): AuthUser | null {
    return this.tokenService.getCurrentUserFromToken();
  }

  isAuthenticated(): boolean {
    return this.tokenService.isLoggedIn();
  }
}
