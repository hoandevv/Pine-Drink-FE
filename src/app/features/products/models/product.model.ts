export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface ProductSummary {
  id: string;
  code: string;
  name: string;
  price: number;
  basePrice?: number;
  imageUrl?: string;
  categoryName?: string;
  status: ProductStatus;
}

export interface Product extends ProductSummary {
  categoryId: string;
  description?: string;
  preparationMinutes?: number;
  featured?: boolean;
  bestSeller?: boolean;
  availableIceLevels?: string;
  availableSugarLevels?: string;
  createdAt?: string;
  updatedAt?: string;
}
