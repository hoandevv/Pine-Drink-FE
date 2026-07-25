import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import {
  CancelOrderRequest,
  CreateOrderRequest,
  Order,
  OrderStatus,
  UpdateOrderStatusRequest
} from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.orders}`;

  constructor(private readonly http: HttpClient) {}

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http
      .post<BaseResponse<Order>>(this.apiUrl, request)
      .pipe(map((response) => response.data));
  }

  getOrderById(id: string): Observable<Order> {
    const url = `${this.apiUrl}/${id}`;

    return this.http
      .get<BaseResponse<Order>>(url)
      .pipe(map((response) => response.data));
  }

  getOrderByCode(orderCode: string): Observable<Order> {
    const url = `${this.apiUrl}/code/${orderCode}`;

    return this.http
      .get<BaseResponse<Order>>(url, { headers: { 'X-Skip-Error-Toast': 'true' } })
      .pipe(map((response) => response.data));
  }

  getMyOrders(page = 0, size = 10): Observable<PageResponse<Order>> {
    const url = `${this.apiUrl}/my-orders`;
    const params = this.createPageParams(page, size);

    return this.http
      .get<BaseResponse<PageResponse<Order>>>(url, { params })
      .pipe(map((response) => response.data));
  }

  getMyOrderSummaries(page = 0, size = 10): Observable<PageResponse<Order>> {
    const url = `${this.apiUrl}/my-orders/summaries`;
    const params = this.createPageParams(page, size);

    return this.http
      .get<BaseResponse<PageResponse<Order>>>(url, { params })
      .pipe(map((response) => response.data));
  }

  getBranchOrders(
    branchId: string,
    page = 0,
    size = 10,
    status?: OrderStatus | 'ALL'
  ): Observable<PageResponse<Order>> {
    const url = `${this.apiUrl}/branch/${branchId}/summaries`;
    const params = this.createOrderListParams(page, size, status);

    return this.http
      .get<BaseResponse<PageResponse<Order>>>(url, { params })
      .pipe(map((response) => response.data));
  }

  getOrders(
    page = 0,
    size = 10,
    status?: OrderStatus | 'ALL',
    branchId?: string
  ): Observable<PageResponse<Order>> {
    if (branchId) {
      return this.getBranchOrders(branchId, page, size, status);
    }

    const url = `${this.apiUrl}/summaries`;
    const params = this.createOrderListParams(page, size, status);

    return this.http
      .get<BaseResponse<PageResponse<Order>>>(url, { params })
      .pipe(map((response) => response.data));
  }

  updateOrderStatus(
    id: string,
    status: OrderStatus,
    reason?: string,
    paymentMethod?: string
  ): Observable<Order> {
    const url = `${this.apiUrl}/${id}/status`;
    const request: UpdateOrderStatusRequest = { status };

    const cleanReason = reason?.trim();
    if (cleanReason) {
      request.reason = cleanReason;
    }

    const cleanPaymentMethod = paymentMethod?.trim();
    if (cleanPaymentMethod) {
      request.paymentMethod = cleanPaymentMethod;
    }

    return this.http
      .patch<BaseResponse<Order>>(url, request)
      .pipe(map((response) => response.data));
  }

  cancelOrder(id: string, reason: string): Observable<Order> {
    const url = `${this.apiUrl}/${id}/cancel`;
    const request: CancelOrderRequest = { reason };

    return this.http
      .post<BaseResponse<Order>>(url, request)
      .pipe(map((response) => response.data));
  }

  private createPageParams(page: number, size: number): HttpParams {
    return new HttpParams()
      .set('page', page)
      .set('size', size);
  }

  private createOrderListParams(
    page: number,
    size: number,
    status?: OrderStatus | 'ALL'
  ): HttpParams {
    let params = this.createPageParams(page, size);

    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return params;
  }
}
