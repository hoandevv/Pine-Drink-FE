import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import {
  BranchPerformanceResponse,
  DashboardAnalyticsData,
  DashboardFilters,
  DashboardOverviewResponse,
  OrderStatusSummaryResponse,
  RevenueTrendResponse,
  TopProductResponse
} from '../models/dashboard-analytics.model';

@Injectable({ providedIn: 'root' })
export class DashboardAnalyticsService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.dashboard.admin}`;

  constructor(private readonly http: HttpClient) {}

  getAnalytics(filters: DashboardFilters): Observable<DashboardAnalyticsData> {
    return forkJoin({
      overview: this.getOverview(filters),
      revenueTrend: this.getRevenueTrend(filters),
      orderStatus: this.getOrderStatus(filters),
      topProducts: this.getTopProducts(filters),
      branchPerformance: this.getBranchPerformance(filters)
    });
  }

  getOverview(filters: DashboardFilters): Observable<DashboardOverviewResponse> {
    return this.http
      .get<BaseResponse<DashboardOverviewResponse>>(`${this.apiUrl}/overview`, { params: this.buildParams(filters) })
      .pipe(map((response) => response.data));
  }

  getRevenueTrend(filters: DashboardFilters): Observable<RevenueTrendResponse[]> {
    return this.http
      .get<BaseResponse<RevenueTrendResponse[]>>(`${this.apiUrl}/revenue-trend`, { params: this.buildParams(filters) })
      .pipe(map((response) => response.data || []));
  }

  getOrderStatus(filters: DashboardFilters): Observable<OrderStatusSummaryResponse[]> {
    return this.http
      .get<BaseResponse<OrderStatusSummaryResponse[]>>(`${this.apiUrl}/order-status`, { params: this.buildParams(filters) })
      .pipe(map((response) => response.data || []));
  }

  getTopProducts(filters: DashboardFilters): Observable<TopProductResponse[]> {
    return this.http
      .get<BaseResponse<TopProductResponse[]>>(`${this.apiUrl}/top-products`, {
        params: this.buildParams({ ...filters, limit: filters.limit || 10 })
      })
      .pipe(map((response) => response.data || []));
  }

  getBranchPerformance(filters: DashboardFilters): Observable<BranchPerformanceResponse[]> {
    return this.http
      .get<BaseResponse<BranchPerformanceResponse[]>>(`${this.apiUrl}/branch-performance`, {
        params: this.buildParams({ fromDate: filters.fromDate, toDate: filters.toDate })
      })
      .pipe(map((response) => response.data || []));
  }

  private buildParams(filters: DashboardFilters): HttpParams {
    let params = new HttpParams()
      .set('fromDate', filters.fromDate)
      .set('toDate', filters.toDate);

    if (filters.branchId) {
      params = params.set('branchId', filters.branchId);
    }

    if (filters.limit) {
      params = params.set('limit', filters.limit);
    }

    return params;
  }
}
