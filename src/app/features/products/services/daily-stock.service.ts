import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import {
  CopyDailyStockQuotaRequest,
  CopyDailyStockQuotaResponse,
  DailyStock,
  DailyStockLog,
  SetDailyStockQuotaRequest,
  UpdateDailyStockQuotaRequest
} from '../models/daily-stock.model';

@Injectable({ providedIn: 'root' })
export class DailyStockService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin/daily-stocks`;

  constructor(private readonly http: HttpClient) {}

  getByBranchAndDate(branchId: string, date: string): Observable<DailyStock[]> {
    const params = new HttpParams().set('branchId', branchId).set('date', date);
    return this.http
      .get<BaseResponse<DailyStock[]>>(this.apiUrl, { params })
      .pipe(map((response) => response.data || []));
  }

  setQuota(request: SetDailyStockQuotaRequest): Observable<DailyStock> {
    return this.http
      .post<BaseResponse<DailyStock>>(this.apiUrl, request)
      .pipe(map((response) => response.data));
  }

  updateQuota(id: string, request: UpdateDailyStockQuotaRequest): Observable<DailyStock> {
    return this.http
      .patch<BaseResponse<DailyStock>>(`${this.apiUrl}/${id}/quota`, request)
      .pipe(map((response) => response.data));
  }

  copyQuota(request: CopyDailyStockQuotaRequest): Observable<CopyDailyStockQuotaResponse> {
    return this.http
      .post<BaseResponse<CopyDailyStockQuotaResponse>>(`${this.apiUrl}/copy`, request)
      .pipe(map((response) => response.data));
  }

  getLogs(id: string, page = 0, size = 20): Observable<PageResponse<DailyStockLog>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<BaseResponse<PageResponse<DailyStockLog>>>(`${this.apiUrl}/${id}/logs`, { params })
      .pipe(map((response) => this.normalizePage(response.data, page, size)));
  }

  private normalizePage(data: PageResponse<DailyStockLog> | null | undefined, page: number, size: number): PageResponse<DailyStockLog> {
    const content = data?.content || [];
    return {
      content,
      page: data?.page ?? page,
      size: data?.size ?? size,
      totalElements: data?.totalElements ?? content.length,
      totalPages: data?.totalPages ?? (content.length ? 1 : 0),
      first: data?.first ?? page === 0,
      last: data?.last ?? true
    };
  }
}
