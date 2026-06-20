export type DailyStockStatus = 'ACTIVE' | 'INACTIVE';
export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_SET';
export type DailyStockActionType = 'SET_QUOTA' | 'COPY_QUOTA' | 'ADJUST' | 'RESERVE' | 'SOLD' | 'RELEASE';

export interface DailyStock {
  id: string;
  branchId: string;
  branchName?: string;
  variantId: string;
  variantName?: string;
  productId?: string;
  productName?: string;
  stockDate: string;
  dailyQuantity: number;
  soldQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  stockStatus?: StockStatus;
  status: DailyStockStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SetDailyStockQuotaRequest {
  branchId: string;
  variantId: string;
  stockDate: string;
  dailyQuantity: number;
  reason?: string;
}

export interface UpdateDailyStockQuotaRequest {
  dailyQuantity: number;
  reason?: string;
}

export interface CopyDailyStockQuotaRequest {
  branchId: string;
  sourceDate: string;
  targetDate: string;
  overwrite: boolean;
  reason?: string;
}

export interface CopyDailyStockQuotaResponse {
  sourceDate: string;
  targetDate: string;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
}

export interface DailyStockLog {
  id: string;
  dailyStockId: string;
  orderId?: string;
  actionType: DailyStockActionType;
  quantity: number;
  beforeDailyQuantity: number;
  afterDailyQuantity: number;
  beforeSoldQuantity: number;
  afterSoldQuantity: number;
  beforeReservedQuantity: number;
  afterReservedQuantity: number;
  reason?: string;
  createdAt?: string;
  createdBy?: string;
}
