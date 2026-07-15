export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface ProductSummary {
  id: string;
  code: string;
  name: string;
  price: number;
  basePrice?: number;
  imageUrl?: string;
  categoryId?: string;
  categoryName?: string;
  preparationMinutes?: number;
  featured?: boolean;
  bestSeller?: boolean;
  description?: string;
  createdAt?: string;
  status: ProductStatus;
}

export interface Product extends ProductSummary {
  categoryId: string;
  availableIceLevels?: string;
  availableSugarLevels?: string;
  updatedAt?: string;
}
