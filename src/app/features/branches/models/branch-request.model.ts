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
  brandId?: string;
}

export type BranchUpdateRequest = BranchCreateRequest;
