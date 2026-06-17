import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { BaseResponse } from '../../../shared/models/base-response.model';
import {
  BranchProductAvailability,
  BranchProductAvailabilityRequest,
  BranchToppingAvailability
} from '../models/branch-availability.model';

@Injectable({ providedIn: 'root' })
export class BranchAvailabilityService {
  private readonly branchesUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.branches}`;
  private readonly adminBranchesUrl = `${environment.apiBaseUrl}/admin${API_ENDPOINTS.branches}`;

  constructor(private readonly http: HttpClient) {}

  getProductAvailabilities(branchId: string): Observable<BranchProductAvailability[]> {
    return this.http
      .get<BaseResponse<BranchProductAvailability[]>>(this.publicAvailabilityUrl(branchId, 'products'))
      .pipe(map((response) => (response.data || []).map((item) => this.normalizeProductAvailability(item))));
  }

  getToppingAvailabilities(branchId: string): Observable<BranchToppingAvailability[]> {
    return this.http
      .get<BaseResponse<BranchToppingAvailability[]>>(this.publicAvailabilityUrl(branchId, 'toppings'))
      .pipe(map((response) => (response.data || []).map((item) => this.normalizeToppingAvailability(item))));
  }

  createProductAvailability(branchId: string, request: BranchProductAvailabilityRequest): Observable<BranchProductAvailability> {
    return this.http
      .post<BaseResponse<BranchProductAvailability>>(this.adminAvailabilityUrl(branchId, 'products'), request)
      .pipe(map((response) => this.normalizeProductAvailability(response.data)));
  }

  updateProductAvailability(branchId: string, id: string, request: BranchProductAvailabilityRequest): Observable<BranchProductAvailability> {
    return this.http
      .put<BaseResponse<BranchProductAvailability>>(`${this.adminAvailabilityUrl(branchId, 'products')}/${id}`, request)
      .pipe(map((response) => this.normalizeProductAvailability(response.data)));
  }

  private publicAvailabilityUrl(branchId: string, resource: 'products' | 'toppings'): string {
    return `${this.branchesUrl}/${branchId}/availability/${resource}`;
  }

  private adminAvailabilityUrl(branchId: string, resource: 'products' | 'toppings'): string {
    return `${this.adminBranchesUrl}/${branchId}/availability/${resource}`;
  }

  private normalizeProductAvailability(item: BranchProductAvailability): BranchProductAvailability {
    return {
      ...item,
      id: item?.id || '',
      branchId: item?.branchId || '',
      productId: item?.productId || '',
      productName: item?.productName || '',
      available: Boolean(item?.available),
      salePrice: item?.salePrice === null || item?.salePrice === undefined ? null : Number(item.salePrice),
      soldOutReason: item?.soldOutReason || null,
      availableFrom: item?.availableFrom || null,
      availableTo: item?.availableTo || null,
      status: item?.status || 'ACTIVE'
    };
  }

  private normalizeToppingAvailability(item: BranchToppingAvailability): BranchToppingAvailability {
    return {
      ...item,
      id: item?.id || '',
      branchId: item?.branchId || '',
      toppingId: item?.toppingId || '',
      toppingName: item?.toppingName || '',
      available: Boolean(item?.available),
      soldOutReason: item?.soldOutReason || null,
      status: item?.status || 'ACTIVE'
    };
  }
}
