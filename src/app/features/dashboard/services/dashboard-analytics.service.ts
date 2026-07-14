import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import {
  DashboardAnalyticsData,
  DashboardFilters,
} from '../models/dashboard-analytics.model';

@Injectable({ providedIn: 'root' })
export class DashboardAnalyticsService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.dashboard.admin}`;

  constructor(private readonly http: HttpClient) {}

  getAnalytics(filters: DashboardFilters): Observable<DashboardAnalyticsData> {
    return this.http
      .get<BaseResponse<DashboardAnalyticsData>>(`${this.apiUrl}/getAllData`,
         {
           params: this.buildParams(filters)
          
          })
      .pipe(map((response) => response.data));
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
