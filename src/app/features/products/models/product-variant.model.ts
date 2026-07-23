export type ProductVariantStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductVariantSummary {
  id: string;
  productId: string;
  variantCode?: string;
  variantName: string;
  sizeLabel?: string;
  priceDelta: number;
  finalPrice?: number;
  displayOrder: number;
  status: ProductVariantStatus;
}

export interface ProductVariant extends ProductVariantSummary {
  productCode?: string;
  productName?: string;
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
