import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseResponse } from '../../shared/models/base-response.model';
import { GeocodingResult, GeocodingSearchRequest, ReverseGeocodingResult } from '../../shared/models/geocoding.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  constructor(private readonly http: HttpClient) {}

  searchAddress(request: GeocodingSearchRequest): Observable<GeocodingResult[]> {
    return this.http
      .post<BaseResponse<GeocodingResult[]>>(`${environment.apiBaseUrl}${API_ENDPOINTS.geocoding.search}`, request)
      .pipe(map((response) => response.data));
  }

  reverseGeocode(latitude: number, longitude: number): Observable<ReverseGeocodingResult> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString());

    return this.http
      .get<BaseResponse<ReverseGeocodingResult>>(`${environment.apiBaseUrl}${API_ENDPOINTS.geocoding.reverse}`, { params })
      .pipe(map((response) => response.data));
  }
}
