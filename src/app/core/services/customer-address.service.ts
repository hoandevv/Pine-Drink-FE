import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseResponse } from '../../shared/models/base-response.model';
import { CreateAddressRequest, CustomerAddress, UpdateAddressRequest } from '../../shared/models/customer-address.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class CustomerAddressService {
  constructor(private readonly http: HttpClient) {}

  getAddresses(): Observable<CustomerAddress[]> {
    return this.http
      .get<BaseResponse<any>>(`${environment.apiBaseUrl}${API_ENDPOINTS.customerAddress.base}`)
      .pipe(
        map((response) => {
          // Handle both paginated and non-paginated responses
          if (response.data && response.data.content) {
            return response.data.content;
          }
          return response.data || [];
        })
      );
  }

  getAddressById(id: string): Observable<CustomerAddress> {
    return this.http
      .get<BaseResponse<CustomerAddress>>(`${environment.apiBaseUrl}${API_ENDPOINTS.customerAddress.detail(id)}`)
      .pipe(map((response) => response.data));
  }

  createAddress(request: CreateAddressRequest): Observable<CustomerAddress> {
    return this.http
      .post<BaseResponse<CustomerAddress>>(`${environment.apiBaseUrl}${API_ENDPOINTS.customerAddress.base}`, request)
      .pipe(map((response) => response.data));
  }

  updateAddress(id: string, request: UpdateAddressRequest): Observable<CustomerAddress> {
    return this.http
      .put<BaseResponse<CustomerAddress>>(`${environment.apiBaseUrl}${API_ENDPOINTS.customerAddress.detail(id)}`, request)
      .pipe(map((response) => response.data));
  }

  setDefaultAddress(id: string): Observable<void> {
    return this.http
      .patch<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.customerAddress.setDefault(id)}`, {})
      .pipe(map((response) => response.data));
  }

  deleteAddress(id: string): Observable<void> {
    return this.http
      .delete<BaseResponse<void>>(`${environment.apiBaseUrl}${API_ENDPOINTS.customerAddress.detail(id)}`)
      .pipe(map((response) => response.data));
  }
}
