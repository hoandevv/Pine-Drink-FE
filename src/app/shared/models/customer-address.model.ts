export interface CustomerAddress {
  id: string;
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  receiverName?: string;
  receiverPhone?: string;
  addressLine?: string;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}
