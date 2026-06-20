export type ProductToppingStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductTopping {
  id: string;
  productId: string;
  productCode?: string;
  productName?: string;
  toppingId: string;
  toppingCode?: string;
  toppingName: string;
  toppingPrice: number;
  toppingImageUrl?: string;
  toppingGroupName?: string;
  isDefault: boolean;
  maxQuantity: number;
  status: ProductToppingStatus;
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
