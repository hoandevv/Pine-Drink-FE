import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { CreateReportJobRequest, ReportJobResponse, ReportJobStatsResponse } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.reports.jobs}`;

  constructor(private readonly http: HttpClient) {}

  createJob(request: CreateReportJobRequest): Observable<ReportJobResponse> {
    return this.http
      .post<BaseResponse<ReportJobResponse>>(this.apiUrl, request)
      .pipe(map((response) => response.data));
  }

  getJob(id: string): Observable<ReportJobResponse> {
    return this.http
      .get<BaseResponse<ReportJobResponse>>(`${this.apiUrl}/${id}`, {
        headers: { 'X-Skip-Loading': 'true' }
      })
      .pipe(map((response) => response.data));
  }

  downloadJob(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }

  getJobHistory(page = 0, size = 20): Observable<PageResponse<ReportJobResponse>> {
    return this.http
      .get<BaseResponse<PageResponse<ReportJobResponse>>>(this.apiUrl, {
        params: { page, size, sort: 'createdAt,desc' }
      })
      .pipe(map((response) => response.data));
  }

  getJobStats(): Observable<ReportJobStatsResponse> {
    return this.http
      .get<BaseResponse<ReportJobStatsResponse>>(`${this.apiUrl}/stats`)
      .pipe(map((response) => response.data));
  }
}
