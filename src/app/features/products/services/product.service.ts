import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { Product } from '../models/product.model';
import { ProductCreateRequest, ProductUpdateRequest } from '../models/product-request.model';

@Injectable()
export class ProductService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.products}`;

  constructor(private readonly http: HttpClient) {}

  getProducts(page: number, size: number, keyword?: string, categoryId?: string, status?: string): Observable<PageResponse<Product>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (keyword) { params = params.set('keyword', keyword); }
    if (categoryId) { params = params.set('categoryId', categoryId); }
    if (status) { params = params.set('status', status); }

    return this.http
      .get<BaseResponse<PageResponse<Product>>>(this.apiUrl, { params })
      .pipe(map((response) => response.data));
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<BaseResponse<Product>>(`${this.apiUrl}/${id}`).pipe(map((response) => response.data));
  }

  createProduct(request: ProductCreateRequest): Observable<Product> {
    return this.http.post<BaseResponse<Product>>(this.apiUrl, request).pipe(map((response) => response.data));
  }

  updateProduct(id: string, request: ProductUpdateRequest): Observable<Product> {
    return this.http.put<BaseResponse<Product>>(`${this.apiUrl}/${id}`, request).pipe(map((response) => response.data));
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<BaseResponse<null>>(`${this.apiUrl}/${id}`).pipe(map(() => void 0));
  }
}
