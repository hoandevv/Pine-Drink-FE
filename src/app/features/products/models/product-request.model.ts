import { ProductStatus } from './product.model';

export interface ProductCreateRequest {
  code: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  categoryId?: string;
  status?: ProductStatus;
}
