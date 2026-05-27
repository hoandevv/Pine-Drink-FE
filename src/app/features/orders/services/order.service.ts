import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { Order, OrderStatus } from '../models/order.model';

@Injectable()
export class OrderService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.orders}`;

  constructor(private readonly http: HttpClient) {}

  getOrders(page: number, size: number, status?: string): Observable<PageResponse<Order>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) { params = params.set('status', status); }

    return this.http.get<BaseResponse<PageResponse<Order>>>(this.apiUrl, { params }).pipe(map((response) => response.data));
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<BaseResponse<Order>>(`${this.apiUrl}/${id}`).pipe(map((response) => response.data));
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<BaseResponse<Order>>(`${this.apiUrl}/${id}/status`, { status }).pipe(map((response) => response.data));
  }
}
