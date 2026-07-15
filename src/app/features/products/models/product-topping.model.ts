export type ProductToppingStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductToppingSummary {
  id: string;
  productId: string;
  toppingId: string;
  toppingCode?: string;
  toppingName: string;
  toppingPrice: number;
  toppingImageUrl?: string;
  toppingGroupName?: string;
  isDefault: boolean;
  maxQuantity: number;
  status: ProductToppingStatus;
}

export interface ProductTopping extends ProductToppingSummary {
  productCode?: string;
  productName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductToppingAssignRequest {
  toppingId: string;
  isDefault: boolean;
  maxQuantity: number;
}

export interface ProductToppingUpdateRequest {
  isDefault?: boolean;
  maxQuantity?: number;
}

export interface ProductToppingStatusRequest {
  status: ProductToppingStatus;
}
