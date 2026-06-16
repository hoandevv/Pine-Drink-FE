import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { PageResponse } from 'src/app/shared/models/page-response.model';

export type VoucherDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | string;
export type VoucherStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DELETED' | string;

export interface VoucherResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  usageLimitPerCustomer?: number | null;
  startAt: string;
  endAt: string;
  status: VoucherStatus;
  branchIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VoucherPayload {
  code: string;
  name: string;
  description?: string | null;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  usageLimit?: number | null;
  usageLimitPerCustomer?: number | null;
  startAt: string;
  endAt: string;
  branchIds?: string[];
}

export interface VoucherSearchParams {
  keyword?: string;
  status?: string;
  discountType?: string;
  branchId?: string;
  activeAt?: string;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class VoucherService {
  private readonly apiUrl = `${environment.apiBaseUrl}/vouchers`;

  constructor(private readonly http: HttpClient) {}

  search(params: VoucherSearchParams): Observable<BaseResponse<PageResponse<VoucherResponse>>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<BaseResponse<PageResponse<VoucherResponse>>>(this.apiUrl, { params: httpParams });
  }

  getAvailableForCustomer(params: { branchId: string; page?: number; size?: number; sort?: string }): Observable<BaseResponse<PageResponse<VoucherResponse>>> {
    let httpParams = new HttpParams().set('branchId', params.branchId);
    httpParams = httpParams.set('page', (params.page ?? 0).toString());
    httpParams = httpParams.set('size', (params.size ?? 20).toString());
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    return this.http.get<BaseResponse<PageResponse<VoucherResponse>>>(`${this.apiUrl}/customer/available`, { params: httpParams });
  }

  create(payload: VoucherPayload): Observable<BaseResponse<VoucherResponse>> {
    return this.http.post<BaseResponse<VoucherResponse>>(this.apiUrl, payload);
  }

  update(id: string, payload: VoucherPayload): Observable<BaseResponse<VoucherResponse>> {
    return this.http.put<BaseResponse<VoucherResponse>>(`${this.apiUrl}/${id}`, payload);
  }

  updateStatus(id: string, status: string): Observable<BaseResponse<VoucherResponse>> {
    return this.http.patch<BaseResponse<VoucherResponse>>(`${this.apiUrl}/${id}/status`, { status });
  }

  delete(id: string): Observable<BaseResponse<void>> {
    return this.http.delete<BaseResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
