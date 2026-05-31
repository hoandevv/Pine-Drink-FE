import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { TokenService } from '../../../core/services/token.service';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { BranchCreateRequest, BranchUpdateRequest, BranchStatusUpdateRequest } from '../models/branch-request.model';
import { Branch } from '../models/branch.model';

@Injectable()
export class BranchService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.branches}`;
  private readonly defaultBrandId = '00000000-0000-0000-0000-000000000001';

  constructor(private readonly http: HttpClient, private readonly tokenService: TokenService) {}

  getBranches(page: number, size: number, keyword?: string, status?: string): Observable<PageResponse<Branch>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (keyword) { params = params.set('keyword', keyword); }
    if (status) { params = params.set('status', status); }

    return this.http
      .get<BaseResponse<PageResponse<Branch> | Branch[]>>(this.getBrandBranchesUrl(), { params })
      .pipe(map((response) => this.normalizePageResponse(response.data, page, size)));
  }

  getActiveBranches(page = 0, size = 100): Observable<PageResponse<Branch>> {
    return this.http
      .get<BaseResponse<Branch[]>>(`${this.apiUrl}/brand/${this.getBrandId()}/active`)
      .pipe(map((response) => this.normalizePageResponse(response.data, page, size)));
  }

  private normalizePageResponse(data: PageResponse<Branch> | Branch[], page: number, size: number): PageResponse<Branch> {
    if (Array.isArray(data)) {
      return {
        content: data,
        page,
        size,
        totalElements: data.length,
        totalPages: data.length > 0 ? 1 : 0,
        first: true,
        last: true
      };
    }

    const content = data?.content || [];
    return {
      content,
      page: data?.page ?? page,
      size: data?.size ?? size,
      totalElements: data?.totalElements ?? content.length,
      totalPages: data?.totalPages ?? (content.length > 0 ? 1 : 0),
      first: data?.first ?? true,
      last: data?.last ?? true
    };
  }

  getBranchById(id: string): Observable<Branch> {
    return this.http.get<BaseResponse<Branch>>(`${this.apiUrl}/${id}`).pipe(map((response) => response.data));
  }

  createBranch(request: BranchCreateRequest): Observable<Branch> {
    return this.http.post<BaseResponse<Branch>>(this.apiUrl, this.withBrandId(request)).pipe(map((response) => response.data));
  }

  updateBranch(id: string, request: BranchUpdateRequest): Observable<Branch> {
    return this.http.put<BaseResponse<Branch>>(`${this.apiUrl}/${id}`, request).pipe(map((response) => response.data));
  }

  updateBranchStatus(id: string, request: BranchStatusUpdateRequest): Observable<Branch> {
    return this.http.patch<BaseResponse<Branch>>(`${this.apiUrl}/${id}/status`, request).pipe(map((response) => response.data));
  }

  closeBranch(id: string): Observable<Branch> {
    return this.updateBranchStatus(id, { status: 'INACTIVE' });
  }

  restoreBranch(id: string): Observable<Branch> {
    return this.updateBranchStatus(id, { status: 'ACTIVE' });
  }

  private getBrandBranchesUrl(): string {
    const brandId = this.getBrandId();
    return brandId ? `${this.apiUrl}/brand/${brandId}` : this.apiUrl;
  }

  private withBrandId(request: BranchCreateRequest): BranchCreateRequest {
    return {
      ...request,
      brandId: request.brandId || this.getBrandId()
    };
  }

  private getBrandId(): string {
    return this.tokenService.getStoredUser()?.brandId || this.defaultBrandId;
  }
}
