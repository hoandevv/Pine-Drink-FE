import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { CreateReportJobRequest, ReportJobResponse } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = `${environment.apiBaseUrl}/reports/jobs`;

  constructor(private readonly http: HttpClient) {}

  createJob(request: CreateReportJobRequest): Observable<ReportJobResponse> {
    return this.http
      .post<BaseResponse<ReportJobResponse>>(this.apiUrl, request)
      .pipe(map((response) => response.data));
  }

  getJob(id: string): Observable<ReportJobResponse> {
    return this.http
      .get<BaseResponse<ReportJobResponse>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  downloadJob(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }
}
