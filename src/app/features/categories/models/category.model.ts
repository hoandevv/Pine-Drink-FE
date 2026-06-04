export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  status: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
}
