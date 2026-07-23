import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import {
  MomoCreatePaymentRequest,
  MomoCreatePaymentResponse,
  PaymentTransactionResponse,
  RecordOfflinePaymentRequest
} from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.payments.base}`;

  constructor(private readonly http: HttpClient) {}

  recordOfflinePayment(request: RecordOfflinePaymentRequest): Observable<PaymentTransactionResponse> {
    const url = `${this.apiUrl}/offline/record`;

    return this.http
      .post<BaseResponse<PaymentTransactionResponse>>(url, request)
      .pipe(map((response) => response.data));
  }

  getOrderPaymentStatus(orderId: string): Observable<PaymentTransactionResponse> {
    const url = `${this.apiUrl}/orders/${orderId}/status`;

    return this.http
      .get<BaseResponse<PaymentTransactionResponse>>(url)
      .pipe(map((response) => response.data));
  }

  createMomoPayment(request: MomoCreatePaymentRequest): Observable<MomoCreatePaymentResponse> {
    const url = `${this.apiUrl}/momo/create`;

    return this.http
      .post<BaseResponse<MomoCreatePaymentResponse>>(url, request)
      .pipe(map((response) => response.data));
  }
}
