import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { PageResponse } from 'src/app/shared/models/page-response.model';

export interface AccountListItemResponse {
  id: string;
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

export interface AccountRoleAssignmentResponse {
  assignmentId: string;
  roleId?: string;
  roleCode: string;
  roleName?: string;
  scopeId?: string;
  scopeType?: 'SYSTEM' | 'BRANCH' | string;
  scopeBranchId?: string | null;
  status?: string;
  assignedAt?: string | null;
  expiresAt?: string | null;
}

export interface AccountDetailResponse extends AccountListItemResponse {
  phone: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  createdAt: string;
  updatedAt: string;
  roleAssignments?: AccountRoleAssignmentResponse[];
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
  avatarUrl?: string;
  roleCode: string;
  status?: string;
  scopeType?: 'SYSTEM' | 'BRANCH' | string;
  scopeBranchId?: string;
}

export interface UpdateAccountRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AssignRoleRequest {
  roleCode: string;
  scopeType?: 'SYSTEM' | 'BRANCH' | string;
  branchId?: string;
  expiresAt?: string;
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
    branchId?: string;
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

  getAccountRoles(id: string): Observable<BaseResponse<AccountRoleAssignmentResponse[]>> {
    return this.http.get<BaseResponse<AccountRoleAssignmentResponse[]>>(`${this.apiUrl}/${id}/roles`);
  }

  assignRole(id: string, request: AssignRoleRequest): Observable<BaseResponse<AccountRoleAssignmentResponse[]>> {
    return this.http.post<BaseResponse<AccountRoleAssignmentResponse[]>>(`${this.apiUrl}/${id}/roles`, request);
  }

  revokeRole(id: string, assignmentId: string): Observable<BaseResponse<void>> {
    return this.http.delete<BaseResponse<void>>(`${this.apiUrl}/${id}/roles/${assignmentId}`);
  }
}
