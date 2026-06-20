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
  status: BranchStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
