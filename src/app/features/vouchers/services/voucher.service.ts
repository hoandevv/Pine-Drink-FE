import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from 'src/app/core/constants/api-endpoints';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { PageResponse } from 'src/app/shared/models/page-response.model';
import { environment } from 'src/environments/environment';

import {
  CustomerAvailableVoucherParams,
  VoucherPayload,
  VoucherResponse,
  VoucherSearchParams
} from '../models/voucher.model';

@Injectable({ providedIn: 'root' })
export class VoucherService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.vouchers.base}`;

  constructor(private readonly http: HttpClient) {}

  search(params: VoucherSearchParams): Observable<BaseResponse<PageResponse<VoucherResponse>>> {
    const httpParams = this.createSearchParams(params);

    return this.http.get<BaseResponse<PageResponse<VoucherResponse>>>(this.apiUrl, {
      params: httpParams
    });
  }

  getAvailableForCustomer(
    params: CustomerAvailableVoucherParams
  ): Observable<BaseResponse<PageResponse<VoucherResponse>>> {
    const url = `${this.apiUrl}/customer/available`;
    const httpParams = this.createCustomerAvailableParams(params);

    return this.http.get<BaseResponse<PageResponse<VoucherResponse>>>(url, {
      params: httpParams
    });
  }

  getById(id: string): Observable<BaseResponse<VoucherResponse>> {
    const url = `${this.apiUrl}/${id}`;

    return this.http.get<BaseResponse<VoucherResponse>>(url);
  }

  create(payload: VoucherPayload): Observable<BaseResponse<VoucherResponse>> {
    return this.http.post<BaseResponse<VoucherResponse>>(this.apiUrl, payload);
  }

  update(id: string, payload: VoucherPayload): Observable<BaseResponse<VoucherResponse>> {
    const url = `${this.apiUrl}/${id}`;

    return this.http.put<BaseResponse<VoucherResponse>>(url, payload);
  }

  updateStatus(id: string, status: string): Observable<BaseResponse<VoucherResponse>> {
    const url = `${this.apiUrl}/${id}/status`;
    const body = { status };

    return this.http.patch<BaseResponse<VoucherResponse>>(url, body);
  }

  delete(id: string): Observable<BaseResponse<void>> {
    const url = `${this.apiUrl}/${id}`;

    return this.http.delete<BaseResponse<void>>(url);
  }

  private createSearchParams(params: VoucherSearchParams): HttpParams {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return httpParams;
  }

  private createCustomerAvailableParams(params: CustomerAvailableVoucherParams): HttpParams {
    let httpParams = new HttpParams();

    httpParams = httpParams.set('branchId', params.branchId);
    httpParams = httpParams.set('page', (params.page ?? 0).toString());
    httpParams = httpParams.set('size', (params.size ?? 20).toString());

    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }

    return httpParams;
  }
}
