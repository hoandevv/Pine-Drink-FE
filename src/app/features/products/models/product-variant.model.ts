export type ProductVariantStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductVariant {
  id: string;
  productId: string;
  productCode?: string;
  productName?: string;
  variantCode?: string;
  variantName: string;
  sizeLabel?: string;
  priceDelta: number;
  finalPrice?: number;
  displayOrder: number;
  status: ProductVariantStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariantCreateRequest {
  variantName: string;
  sizeLabel?: string;
  priceDelta: number;
  displayOrder: number;
}

export interface ProductVariantUpdateRequest {
  variantName?: string;
  sizeLabel?: string;
  priceDelta?: number;
  displayOrder?: number;
}

export interface ProductVariantStatusRequest {
  status: ProductVariantStatus;
}
