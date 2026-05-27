export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  categoryName?: string;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
}
