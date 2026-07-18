export type VoucherDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | string;
export type VoucherStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DELETED' | string;

export interface VoucherResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  usageLimitPerCustomer?: number | null;
  startAt: string;
  endAt: string;
  status: VoucherStatus;
  branchIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VoucherPayload {
  code: string;
  name: string;
  description?: string | null;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  usageLimit?: number | null;
  usageLimitPerCustomer?: number | null;
  startAt: string;
  endAt: string;
  branchIds?: string[];
}

export interface VoucherSearchParams {
  keyword?: string;
  status?: string;
  discountType?: string;
  branchId?: string;
  activeAt?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CustomerAvailableVoucherParams {
  branchId: string;
  page?: number;
  size?: number;
  sort?: string;
}