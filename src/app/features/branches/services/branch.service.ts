import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { BranchCreateRequest, BranchStatusUpdateRequest, BranchUpdateRequest } from '../models/branch-request.model';
import { BranchHours, BranchHoursRequest } from '../models/branch-hours.model';
import { Branch } from '../models/branch.model';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.branches}`;

  constructor(private readonly http: HttpClient) {}

  getBranches(page: number, size: number, keyword?: string, status?: string): Observable<PageResponse<Branch>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (keyword) { params = params.set('keyword', keyword); }
    if (status) { params = params.set('status', status); }

    return this.http
      .get<BaseResponse<PageResponse<Branch> | Branch[]>>(this.apiUrl, { params })
      .pipe(map((response) => this.normalizePageResponse(response.data, page, size)));
  }

  getActiveBranches(page = 0, size = 100): Observable<PageResponse<Branch>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<BaseResponse<PageResponse<Branch> | Branch[]>>(`${this.apiUrl}/active`, { params })
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
    return this.http.post<BaseResponse<Branch>>(this.apiUrl, request).pipe(map((response) => response.data));
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

  getBranchHours(branchId: string): Observable<BranchHours[]> {
    return this.http
      .get<BaseResponse<BranchHours[]>>(`${this.apiUrl}/${branchId}/hours`)
      .pipe(map((response) => response.data || []));
  }

  createBranchHours(branchId: string, request: BranchHoursRequest): Observable<BranchHours> {
    return this.http
      .post<BaseResponse<BranchHours>>(`${this.apiUrl}/${branchId}/hours`, request)
      .pipe(map((response) => response.data));
  }

  updateBranchHours(branchId: string, hoursId: string, request: BranchHoursRequest): Observable<BranchHours> {
    return this.http
      .put<BaseResponse<BranchHours>>(`${this.apiUrl}/${branchId}/hours/${hoursId}`, request)
      .pipe(map((response) => response.data));
  }

  deleteBranchHours(branchId: string, hoursId: string): Observable<void> {
    return this.http
      .delete<BaseResponse<void>>(`${this.apiUrl}/${branchId}/hours/${hoursId}`)
      .pipe(map((response) => response.data));
  }
}
