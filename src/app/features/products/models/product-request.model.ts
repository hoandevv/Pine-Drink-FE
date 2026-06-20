export interface ProductCreateRequest {
  name: string;
  description?: string;
  price?: number;
  basePrice?: number;
  imageUrl?: string;
  categoryId: string;
  preparationMinutes?: number;
  featured?: boolean;
  bestSeller?: boolean;
  availableIceLevels?: string;
  availableSugarLevels?: string;
}

export type ProductUpdateRequest = Partial<ProductCreateRequest>;
