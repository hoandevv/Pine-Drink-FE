import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import {
  ProductVariant,
  ProductVariantCreateRequest,
  ProductVariantStatusRequest,
  ProductVariantUpdateRequest
} from '../models/product-variant.model';

@Injectable({ providedIn: 'root' })
export class ProductVariantService {
  private readonly productsUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.products}`;

  constructor(private readonly http: HttpClient) {}

  getVariants(productId: string, page: number, size: number): Observable<PageResponse<ProductVariant>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'displayOrder,asc');

    return this.http
      .get<BaseResponse<PageResponse<ProductVariant>>>(this.variantsUrl(productId), { params })
      .pipe(map((response) => this.normalizePage(response.data, page, size)));
  }

  getActiveVariants(productId: string): Observable<ProductVariant[]> {
    return this.http
      .get<BaseResponse<ProductVariant[]>>(`${this.variantsUrl(productId)}/active`)
      .pipe(map((response) => (response.data || []).map((variant) => this.normalizeVariant(variant))));
  }

  createVariant(productId: string, request: ProductVariantCreateRequest): Observable<ProductVariant> {
    return this.http
      .post<BaseResponse<ProductVariant>>(this.variantsUrl(productId), this.toBackendRequest(request))
      .pipe(map((response) => this.normalizeVariant(response.data)));
  }

  updateVariant(productId: string, variantId: string, request: ProductVariantUpdateRequest): Observable<ProductVariant> {
    return this.http
      .put<BaseResponse<ProductVariant>>(`${this.variantsUrl(productId)}/${variantId}`, this.toBackendRequest(request))
      .pipe(map((response) => this.normalizeVariant(response.data)));
  }

  updateVariantStatus(productId: string, variantId: string, request: ProductVariantStatusRequest): Observable<ProductVariant> {
    return this.http
      .patch<BaseResponse<ProductVariant>>(`${this.variantsUrl(productId)}/${variantId}/status`, request)
      .pipe(map((response) => this.normalizeVariant(response.data)));
  }

  deleteVariant(productId: string, variantId: string): Observable<void> {
    return this.http.delete<BaseResponse<null>>(`${this.variantsUrl(productId)}/${variantId}`).pipe(map(() => void 0));
  }

  private variantsUrl(productId: string): string {
    return `${this.productsUrl}/${productId}/variants`;
  }

  private toBackendRequest(request: ProductVariantCreateRequest | ProductVariantUpdateRequest): Record<string, unknown> {
    return {
      ...request,
      priceDelta: Number(request.priceDelta) || 0,
      displayOrder: Number(request.displayOrder) || 0
    };
  }

  private normalizePage(
    data: PageResponse<ProductVariant> | null | undefined,
    fallbackPage: number,
    fallbackSize: number
  ): PageResponse<ProductVariant> {
    const content = (data?.content || []).map((variant) => this.normalizeVariant(variant));
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

  private normalizeVariant(variant: ProductVariant): ProductVariant {
    return {
      ...variant,
      id: variant?.id || '',
      productId: variant?.productId || '',
      productCode: variant?.productCode || 'AUTO',
      productName: variant?.productName || '',
      variantCode: variant?.variantCode || 'AUTO',
      variantName: variant?.variantName || 'Biến thể chưa đặt tên',
      sizeLabel: variant?.sizeLabel || '',
      priceDelta: Number(variant?.priceDelta) || 0,
      finalPrice: Number(variant?.finalPrice) || 0,
      displayOrder: Number(variant?.displayOrder) || 0,
      status: (variant?.status || 'ACTIVE') as ProductVariant['status']
    };
  }
}
