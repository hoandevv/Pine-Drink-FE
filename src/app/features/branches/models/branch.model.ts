export interface Branch {
  id: string;
  code?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
  averagePreparationMinutes?: number;
  brandId?: string;
  brandName?: string;
  status: BranchStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
