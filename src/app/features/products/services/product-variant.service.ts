import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import {
  ProductVariant,
  ProductVariantCreateRequest,
  ProductVariantStatusRequest,
  ProductVariantSummary,
  ProductVariantUpdateRequest
} from '../models/product-variant.model';

@Injectable({ providedIn: 'root' })
export class ProductVariantService {
  private readonly productsUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.products}`;
  private readonly variantCache = new Map<string, Observable<ProductVariantSummary[]>>();

  constructor(private readonly http: HttpClient) { }

  getVariants(productId: string, page: number, size: number): Observable<PageResponse<ProductVariantSummary>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'displayOrder,asc');

    return this.http
      .get<BaseResponse<PageResponse<ProductVariantSummary>>>(this.variantsUrl(productId), { params })
      .pipe(map((response) => this.normalizeSummaryPage(response.data, page, size)));
  }

  getActiveVariants(productId: string): Observable<ProductVariantSummary[]> {
    if (!this.variantCache.has(productId)) {
      const request$ = this.http
        .get<BaseResponse<ProductVariantSummary[]>>(`${this.variantsUrl(productId)}/active`)
        .pipe(
          map((response) => (response.data || []).map((variant) => this.normalizeVariantSummary(variant))),
          shareReplay({ bufferSize: 1, refCount: true })
        );
      this.variantCache.set(productId, request$);
    }
    return this.variantCache.get(productId)!;
  }

  getAllActiveVariants(): Observable<ProductVariantSummary[]> {
    return this.http
      .get<BaseResponse<ProductVariantSummary[]>>(`${this.productsUrl}/variants/active`)
      .pipe(map((response) => (response.data || []).map((variant) => this.normalizeVariantSummary(variant))));
  }

  createVariant(productId: string, request: ProductVariantCreateRequest): Observable<ProductVariant> {
    return this.http
      .post<BaseResponse<ProductVariant>>(this.variantsUrl(productId), this.toBackendRequest(request))
      .pipe(
        map((response) => this.normalizeVariant(response.data)),
        map((variant) => {
          this.invalidateCache(productId);
          return variant;
        })
      );
  }

  updateVariant(productId: string, variantId: string, request: ProductVariantUpdateRequest): Observable<ProductVariant> {
    return this.http
      .put<BaseResponse<ProductVariant>>(`${this.variantsUrl(productId)}/${variantId}`, this.toBackendRequest(request))
      .pipe(
        map((response) => this.normalizeVariant(response.data)),
        map((variant) => {
          this.invalidateCache(productId);
          return variant;
        })
      );
  }

  updateVariantStatus(productId: string, variantId: string, request: ProductVariantStatusRequest): Observable<ProductVariant> {
    return this.http
      .patch<BaseResponse<ProductVariant>>(`${this.variantsUrl(productId)}/${variantId}/status`, request)
      .pipe(
        map((response) => this.normalizeVariant(response.data)),
        map((variant) => {
          this.invalidateCache(productId);
          return variant;
        })
      );
  }

  deleteVariant(productId: string, variantId: string): Observable<void> {
    return this.http.delete<BaseResponse<null>>(`${this.variantsUrl(productId)}/${variantId}`).pipe(
      map(() => {
        this.invalidateCache(productId);
        return void 0;
      })
    );
  }

  clearCache(): void {
    this.variantCache.clear();
  }

  private invalidateCache(productId: string): void {
    this.variantCache.delete(productId);
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

  private normalizeSummaryPage(
    data: PageResponse<ProductVariantSummary> | null | undefined,
    fallbackPage: number,
    fallbackSize: number
  ): PageResponse<ProductVariantSummary> {
    const content = (data?.content || []).map((variant) => this.normalizeVariantSummary(variant));
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

  private normalizeVariantSummary(variant: ProductVariantSummary): ProductVariantSummary {
    return {
      ...variant,
      id: variant?.id || '',
      productId: variant?.productId || '',
      variantCode: variant?.variantCode || 'AUTO',
      variantName: variant?.variantName || 'Biến thể chưa đặt tên',
      sizeLabel: variant?.sizeLabel || '',
      priceDelta: Number(variant?.priceDelta) || 0,
      finalPrice: Number(variant?.finalPrice) || 0,
      displayOrder: Number(variant?.displayOrder) || 0,
      status: (variant?.status || 'ACTIVE') as ProductVariantSummary['status']
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
