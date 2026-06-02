export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  basePrice?: number;
  imageUrl?: string;
  categoryId: string;
  categoryName?: string;
  preparationMinutes?: number;
  availableIceLevels?: string;
  availableSugarLevels?: string;
  featured?: boolean;
  bestSeller?: boolean;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
}
