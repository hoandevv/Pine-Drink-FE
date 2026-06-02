import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { Topping, ToppingCreateRequest, ToppingStatusRequest, ToppingUpdateRequest } from '../models/topping.model';

@Injectable({ providedIn: 'root' })
export class ToppingService {
  private readonly toppingsUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.toppings}`;

  constructor(private readonly http: HttpClient) {}

  getToppings(page: number, size: number): Observable<PageResponse<Topping>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');

    return this.http
      .get<BaseResponse<PageResponse<Topping>>>(this.toppingsUrl, { params })
      .pipe(map((response) => this.normalizePage(response.data, page, size)));
  }

  getActiveToppings(): Observable<Topping[]> {
    return this.http
      .get<BaseResponse<Topping[]>>(`${this.toppingsUrl}/active`)
      .pipe(map((response) => (response.data || []).map((topping) => this.normalizeTopping(topping))));
  }

  getTopping(id: string): Observable<Topping> {
    return this.http
      .get<BaseResponse<Topping>>(`${this.toppingsUrl}/${id}`)
      .pipe(map((response) => this.normalizeTopping(response.data)));
  }

  createTopping(request: ToppingCreateRequest): Observable<Topping> {
    return this.http
      .post<BaseResponse<Topping>>(this.toppingsUrl, this.toBackendRequest(request))
      .pipe(map((response) => this.normalizeTopping(response.data)));
  }

  updateTopping(id: string, request: ToppingUpdateRequest): Observable<Topping> {
    return this.http
      .put<BaseResponse<Topping>>(`${this.toppingsUrl}/${id}`, this.toBackendRequest(request))
      .pipe(map((response) => this.normalizeTopping(response.data)));
  }

  updateToppingStatus(id: string, request: ToppingStatusRequest): Observable<Topping> {
    return this.http
      .patch<BaseResponse<Topping>>(`${this.toppingsUrl}/${id}/status`, request)
      .pipe(map((response) => this.normalizeTopping(response.data)));
  }

  deleteTopping(id: string): Observable<void> {
    return this.http.delete<BaseResponse<null>>(`${this.toppingsUrl}/${id}`).pipe(map(() => void 0));
  }

  private toBackendRequest(request: ToppingCreateRequest | ToppingUpdateRequest): Record<string, unknown> {
    return {
      ...request,
      price: Number(request.price) || 0
    };
  }

  private normalizePage(
    data: PageResponse<Topping> | null | undefined,
    fallbackPage: number,
    fallbackSize: number
  ): PageResponse<Topping> {
    const content = (data?.content || []).map((topping) => this.normalizeTopping(topping));
    return {
      ...data,
      content,
      page: data?.page ?? fallbackPage,
      size: data?.size ?? fallbackSize,
      totalElements: data?.totalElements ?? content.length,
      totalPages: data?.totalPages ?? (content.length ? 1 : 0),
      first: data?.first ?? fallbackPage === 0,
      last: data?.last ?? true
    };
  }

  private normalizeTopping(topping: Topping): Topping {
    return {
      ...topping,
      id: topping?.id || '',
      code: topping?.code || 'AUTO',
      name: topping?.name || 'Topping chưa đặt tên',
      price: Number(topping?.price) || 0,
      imageUrl: topping?.imageUrl || '',
      groupName: topping?.groupName || 'Khác',
      status: (topping?.status || 'ACTIVE') as Topping['status']
    };
  }
}
