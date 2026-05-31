export interface BranchCreateRequest {
  code?: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
  supportsPickup?: boolean;
  supportsDelivery?: boolean;
  averagePreparationMinutes?: number;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  brandId?: string;
}

export type BranchUpdateRequest = BranchCreateRequest;

export interface BranchStatusUpdateRequest {
  status: 'ACTIVE' | 'INACTIVE';
}
