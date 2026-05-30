import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { PageResponse } from 'src/app/shared/models/page-response.model';

export interface AccountListItemResponse {
  id: string;
  brandId?: string | null;
  username: string;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  status: string;
  roleCode?: string;
  roles?: string[];
  lastLoginAt?: string | null;
}

export interface AccountDetailResponse extends AccountListItemResponse {
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAccountStatusRequest {
  status: string;
}

export interface CreateAccountRequest {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
  roleCode: string;
  status?: string;
  scopeType?: string;
}

export interface UpdateAccountRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  brandId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly apiUrl = `${environment.apiBaseUrl}/accounts`;

  constructor(private http: HttpClient) {}

  searchAccounts(params: {
    keyword?: string;
    status?: string;
    roleCode?: string;
    brandId?: string;
    page?: number;
    size?: number;
  }): Observable<BaseResponse<PageResponse<AccountListItemResponse>>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<BaseResponse<PageResponse<AccountListItemResponse>>>(this.apiUrl, { params: httpParams });
  }

  getAccountDetail(id: string): Observable<BaseResponse<AccountDetailResponse>> {
    return this.http.get<BaseResponse<AccountDetailResponse>>(`${this.apiUrl}/${id}`);
  }

  createAccount(request: CreateAccountRequest): Observable<BaseResponse<AccountDetailResponse>> {
    return this.http.post<BaseResponse<AccountDetailResponse>>(this.apiUrl, request);
  }

  updateAccount(id: string, request: UpdateAccountRequest): Observable<BaseResponse<AccountDetailResponse>> {
    return this.http.put<BaseResponse<AccountDetailResponse>>(`${this.apiUrl}/${id}`, request);
  }

  updateAccountStatus(id: string, status: string): Observable<BaseResponse<AccountDetailResponse>> {
    return this.http.patch<BaseResponse<AccountDetailResponse>>(`${this.apiUrl}/${id}/status`, { status });
  }
}
