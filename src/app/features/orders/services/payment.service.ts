import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PaymentMethod, PaymentStatus } from '../models/order.model';

export interface RecordOfflinePaymentRequest {
  orderId: string;
  paymentMethod: 'CASH' | 'COD';
}

export interface PaymentTransactionResponse {
  id: string;
  transactionCode: string;
  orderId: string;
  orderCode: string;
  provider: PaymentMethod;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus | 'PENDING' | 'FAILED' | string;
  orderPaymentStatus: PaymentStatus;
  paidAt?: string;
  failedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MomoCreatePaymentRequest {
  orderId: string;
  orderInfo: string;
  extraData?: string;
}

export interface MomoCreatePaymentResponse {
  orderId: string;
  requestId: string;
  payUrl: string;
  deeplink: string;
  qrCodeUrl: string;
  resultCode: number;
  message: string;
  provider: string;
  paymentMethod: string;
  transactionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiBaseUrl}/payments`;

  constructor(private readonly http: HttpClient) {}

  recordOfflinePayment(request: RecordOfflinePaymentRequest): Observable<PaymentTransactionResponse> {
    return this.http
      .post<BaseResponse<PaymentTransactionResponse>>(`${this.apiUrl}/offline/record`, request)
      .pipe(map((response) => response.data));
  }

  getOrderPaymentStatus(orderId: string): Observable<PaymentTransactionResponse> {
    return this.http
      .get<BaseResponse<PaymentTransactionResponse>>(`${this.apiUrl}/orders/${orderId}/status`)
      .pipe(map((response) => response.data));
  }

  createMomoPayment(request: MomoCreatePaymentRequest): Observable<MomoCreatePaymentResponse> {
    return this.http
      .post<BaseResponse<MomoCreatePaymentResponse>>(`${this.apiUrl}/momo/create`, request)
      .pipe(map((response) => response.data));
  }
}
