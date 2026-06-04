import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import {
  ProductTopping,
  ProductToppingAssignRequest,
  ProductToppingStatusRequest,
  ProductToppingUpdateRequest
} from '../models/product-topping.model';

@Injectable({ providedIn: 'root' })
export class ProductToppingService {
  private readonly productsUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.products}`;

  constructor(private readonly http: HttpClient) {}

  getProductToppings(productId: string, page: number, size: number): Observable<PageResponse<ProductTopping>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');

    return this.http
      .get<BaseResponse<PageResponse<ProductTopping> | ProductTopping[]>>(this.productToppingsUrl(productId), { params })
      .pipe(map((response) => this.normalizePage(response.data, page, size)));
  }

  getActiveProductToppings(productId: string): Observable<ProductTopping[]> {
    return this.http
      .get<BaseResponse<ProductTopping[]>>(`${this.productToppingsUrl(productId)}/active`)
      .pipe(map((response) => (response.data || []).map((item) => this.normalizeProductTopping(item))));
  }

  getProductTopping(productId: string, productToppingId: string): Observable<ProductTopping> {
    return this.http
      .get<BaseResponse<ProductTopping>>(`${this.productToppingsUrl(productId)}/${productToppingId}`)
      .pipe(map((response) => this.normalizeProductTopping(response.data)));
  }

  assignProductTopping(productId: string, request: ProductToppingAssignRequest): Observable<ProductTopping> {
    return this.http
      .post<BaseResponse<ProductTopping>>(this.productToppingsUrl(productId), this.toBackendRequest(request))
      .pipe(map((response) => this.normalizeProductTopping(response.data)));
  }

  updateProductTopping(productId: string, productToppingId: string, request: ProductToppingUpdateRequest): Observable<ProductTopping> {
    return this.http
      .put<BaseResponse<ProductTopping>>(`${this.productToppingsUrl(productId)}/${productToppingId}`, this.toBackendRequest(request))
      .pipe(map((response) => this.normalizeProductTopping(response.data)));
  }

  updateProductToppingStatus(productId: string, productToppingId: string, request: ProductToppingStatusRequest): Observable<ProductTopping> {
    return this.http
      .patch<BaseResponse<ProductTopping>>(`${this.productToppingsUrl(productId)}/${productToppingId}/status`, request)
      .pipe(map((response) => this.normalizeProductTopping(response.data)));
  }

  deleteProductTopping(productId: string, productToppingId: string): Observable<void> {
    return this.http.delete<BaseResponse<null>>(`${this.productToppingsUrl(productId)}/${productToppingId}`).pipe(map(() => void 0));
  }

  private productToppingsUrl(productId: string): string {
    return `${this.productsUrl}/${productId}/toppings`;
  }

  private toBackendRequest(request: ProductToppingAssignRequest | ProductToppingUpdateRequest): Record<string, unknown> {
    return {
      ...request,
      maxQuantity: Number(request.maxQuantity) || 1
    };
  }

  private normalizePage(
    data: PageResponse<ProductTopping> | ProductTopping[] | null | undefined,
    fallbackPage: number,
    fallbackSize: number
  ): PageResponse<ProductTopping> {
    if (Array.isArray(data)) {
      const content = data.map((item) => this.normalizeProductTopping(item));
      return {
        content,
        page: fallbackPage,
        size: fallbackSize,
        totalElements: content.length,
        totalPages: content.length ? 1 : 0,
        first: true,
        last: true
      };
    }

    const content = (data?.content || []).map((item) => this.normalizeProductTopping(item));
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

  private normalizeProductTopping(item: ProductTopping): ProductTopping {
    return {
      ...item,
      id: item?.id || '',
      productId: item?.productId || '',
      productCode: item?.productCode || 'AUTO',
      productName: item?.productName || '',
      toppingId: item?.toppingId || '',
      toppingCode: item?.toppingCode || 'AUTO',
      toppingName: item?.toppingName || 'Topping chưa đặt tên',
      toppingPrice: Number(item?.toppingPrice) || 0,
      toppingImageUrl: item?.toppingImageUrl || '',
      toppingGroupName: item?.toppingGroupName || 'Khác',
      isDefault: Boolean(item?.isDefault),
      maxQuantity: Number(item?.maxQuantity) || 1,
      status: (item?.status || 'ACTIVE') as ProductTopping['status']
    };
  }
}
