export interface BranchCreateRequest {
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
}

export type BranchUpdateRequest = BranchCreateRequest;

export interface BranchStatusUpdateRequest {
  status: 'ACTIVE' | 'INACTIVE';
}
