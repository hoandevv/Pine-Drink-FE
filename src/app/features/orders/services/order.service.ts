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
    return this.http
      .get<BaseResponse<Order>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  getOrderByCode(orderCode: string): Observable<Order> {
    return this.http
      .get<BaseResponse<Order>>(`${this.apiUrl}/code/${orderCode}`)
      .pipe(map((response) => response.data));
  }

  getMyOrders(page = 0, size = 10): Observable<PageResponse<Order>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<BaseResponse<PageResponse<Order>>>(`${this.apiUrl}/my-orders`, { params })
      .pipe(map((response) => response.data));
  }

  getBranchOrders(branchId: string, page = 0, size = 10, status?: OrderStatus | 'ALL'): Observable<PageResponse<Order>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http
      .get<BaseResponse<PageResponse<Order>>>(`${this.apiUrl}/branch/${branchId}`, { params })
      .pipe(map((response) => response.data));
  }

  getOrders(page = 0, size = 10, status?: OrderStatus | 'ALL', branchId?: string): Observable<PageResponse<Order>> {
    return branchId
      ? this.getBranchOrders(branchId, page, size, status)
      : this.getMyOrders(page, size);
  }

  updateOrderStatus(id: string, status: OrderStatus, reason?: string): Observable<Order> {
    const request: UpdateOrderStatusRequest = { status, reason };
    return this.http
      .patch<BaseResponse<Order>>(`${this.apiUrl}/${id}/status`, request)
      .pipe(map((response) => response.data));
  }

  cancelOrder(id: string, reason: string): Observable<Order> {
    const request: CancelOrderRequest = { reason };
    return this.http
      .post<BaseResponse<Order>>(`${this.apiUrl}/${id}/cancel`, request)
      .pipe(map((response) => response.data));
  }
}

