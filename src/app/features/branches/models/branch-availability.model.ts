export interface BranchProductAvailability {
  id: string;
  branchId: string;
  productId: string;
  productName?: string;
  available: boolean;
  salePrice?: number | null;
  soldOutReason?: string | null;
  availableFrom?: string | null;
  availableTo?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BranchProductAvailabilityRequest {
  productId: string;
  available: boolean;
  salePrice?: number | null;
  soldOutReason?: string | null;
  availableFrom?: string | null;
  availableTo?: string | null;
}

export interface BranchToppingAvailability {
  id: string;
  branchId: string;
  toppingId: string;
  toppingName?: string;
  available: boolean;
  soldOutReason?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt?: string;
  updatedAt?: string;
}
