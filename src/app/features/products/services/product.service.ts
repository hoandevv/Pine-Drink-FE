import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { Product } from '../models/product.model';
import { ProductCreateRequest, ProductUpdateRequest } from '../models/product-request.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.products}`;

  constructor(private readonly http: HttpClient) {}

  getProducts(page: number, size: number, keyword?: string, categoryId?: string, status?: string): Observable<PageResponse<Product>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (keyword) { params = params.set('keyword', keyword); }
    if (categoryId) { params = params.set('categoryId', categoryId); }
    if (status) { params = params.set('status', status); }

    return this.http
      .get<BaseResponse<PageResponse<Product>>>(this.apiUrl, { params })
      .pipe(map((response) => this.normalizeProductPage(response.data, page, size)));
  }

  getProductById(id: string): Observable<Product> {
    return this.http
      .get<BaseResponse<Product>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.normalizeProduct(response.data)));
  }

  createProduct(request: ProductCreateRequest, file?: File): Observable<Product> {
    if (file) {
      return this.http
        .post<BaseResponse<Product>>(this.apiUrl, this.toMultipartRequest(request, file))
        .pipe(map((response) => this.normalizeProduct(response.data)));
    }

    return this.http
      .post<BaseResponse<Product>>(this.apiUrl, this.toBackendRequest(request))
      .pipe(map((response) => this.normalizeProduct(response.data)));
  }

  updateProduct(id: string, request: ProductUpdateRequest, file?: File): Observable<Product> {
    if (file) {
      return this.http
        .put<BaseResponse<Product>>(`${this.apiUrl}/${id}`, this.toMultipartRequest(request, file))
        .pipe(map((response) => this.normalizeProduct(response.data)));
    }

    return this.http
      .put<BaseResponse<Product>>(`${this.apiUrl}/${id}`, this.toBackendRequest(request))
      .pipe(map((response) => this.normalizeProduct(response.data)));
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<BaseResponse<null>>(`${this.apiUrl}/${id}`).pipe(map(() => void 0));
  }

  updateProductStatus(id: string, status: Product['status']): Observable<Product> {
    return this.http
      .patch<BaseResponse<Product>>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(map((response) => this.normalizeProduct(response.data)));
  }

  private toBackendRequest(request: ProductCreateRequest | ProductUpdateRequest): Record<string, unknown> {
    const { price, ...rest } = request;
    return {
      ...rest,
      ...(price !== undefined ? { basePrice: price } : {})
    };
  }

  private toMultipartRequest(request: ProductCreateRequest | ProductUpdateRequest, file: File): FormData {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(this.toBackendRequest(request))], { type: 'application/json' }));
    formData.append('file', file);
    return formData;
  }

  private normalizeProductPage(data: PageResponse<Product>, fallbackPage: number, fallbackSize: number): PageResponse<Product> {
    const content = (data?.content || []).map((product) => this.normalizeProduct(product));
    return {
      ...data,
      content,
      page: data?.page ?? fallbackPage,
      size: data?.size ?? fallbackSize,
      totalElements: data?.totalElements ?? content.length,
      totalPages: data?.totalPages ?? (content.length > 0 ? 1 : 0),
      first: data?.first ?? true,
      last: data?.last ?? true
    };
  }

  private normalizeProduct(product: Product): Product {
    const basePrice = (product as Product & { basePrice?: number }).basePrice;
    return {
      ...product,
      price: product.price ?? Number(basePrice) ?? 0
    };
  }
}
