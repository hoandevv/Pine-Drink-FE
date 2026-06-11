export interface GeocodingSearchRequest {
  query: string;
  limit?: number;
}

export interface GeocodingResult {
  displayName?: string;
  addressLine?: string;
  formattedAddress?: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  latitude: number | string;
  longitude: number | string;
  confidence: number;
  provider: string;
}

export interface ReverseGeocodingResult {
  displayName: string;
  addressLine: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  confidence: number;
  provider: string;
}
