import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { CategoryCreateRequest, CategoryStatusRequest, CategoryUpdateRequest } from '../models/category-request.model';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.categories}`;

  constructor(private readonly http: HttpClient) { }

  getCategories(page: number, size: number): Observable<PageResponse<Category>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'displayOrder,asc');

    return this.http
      .get<BaseResponse<PageResponse<Category>>>(this.apiUrl, { params })
      .pipe(map((response) => this.normalizePage(response.data, page, size)));
  }

  getActiveCategories(): Observable<Category[]> {
    return this.http
      .get<BaseResponse<Category[]>>(`${this.apiUrl}/active`)
      .pipe(map((response) => (response.data || []).map((category) => this.normalizeCategory(category))));
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http
      .get<BaseResponse<Category>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.normalizeCategory(response.data)));
  }

  createCategory(request: CategoryCreateRequest, file?: File): Observable<Category> {
    if (file) {
      return this.http
        .post<BaseResponse<Category>>(this.apiUrl, this.toMultipartRequest(request, file))
        .pipe(map((response) => this.normalizeCategory(response.data)));
    }

    return this.http
      .post<BaseResponse<Category>>(this.apiUrl, this.toBackendRequest(request))
      .pipe(map((response) => this.normalizeCategory(response.data)));
  }

  updateCategory(id: string, request: CategoryUpdateRequest, file?: File): Observable<Category> {
    if (file) {
      return this.http
        .put<BaseResponse<Category>>(`${this.apiUrl}/${id}`, this.toMultipartRequest(request, file))
        .pipe(map((response) => this.normalizeCategory(response.data)));
    }

    return this.http
      .put<BaseResponse<Category>>(`${this.apiUrl}/${id}`, this.toBackendRequest(request))
      .pipe(map((response) => this.normalizeCategory(response.data)));
  }

  updateCategoryStatus(id: string, request: CategoryStatusRequest): Observable<Category> {
    return this.http
      .patch<BaseResponse<Category>>(`${this.apiUrl}/${id}/status`, request)
      .pipe(map((response) => this.normalizeCategory(response.data)));
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<BaseResponse<null>>(`${this.apiUrl}/${id}`).pipe(map(() => void 0));
  }

  private toBackendRequest(request: CategoryCreateRequest | CategoryUpdateRequest): Record<string, unknown> {
    return {
      name: request.name,
      description: request.description || '',
      imageUrl: request.imageUrl || '',
      displayOrder: Number(request.displayOrder) || 0
    };
  }

  private toMultipartRequest(request: CategoryCreateRequest | CategoryUpdateRequest, file: File): FormData {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(this.toBackendRequest(request))], { type: 'application/json' }));
    formData.append('file', file);
    return formData;
  }

  private normalizePage(data: PageResponse<Category> | null | undefined, fallbackPage: number, fallbackSize: number): PageResponse<Category> {
    const content = (data?.content || []).map((category) => this.normalizeCategory(category));
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

  private normalizeCategory(category: Category): Category {
    return {
      ...category,
      id: category?.id || '',
      code: category?.code || 'AUTO',
      name: category?.name || 'Danh mục chưa đặt tên',
      description: category?.description || '',
      imageUrl: category?.imageUrl || '',
      displayOrder: Number(category?.displayOrder) || 0,
      status: (category?.status || 'ACTIVE') as Category['status']
    };
  }
}
