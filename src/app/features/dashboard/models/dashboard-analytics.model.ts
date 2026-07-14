import { Branch } from '../../branches/models/branch.model';

export interface DashboardOverviewResponse {
  totalRevenue: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  newCustomers: number;
}

export interface RevenueTrendResponse {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface OrderStatusSummaryResponse {
  status: string;
  count: number;
}

export interface TopProductResponse {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface BranchPerformanceResponse {
  branchId: string;
  branchName: string;
  revenue: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

export interface DashboardFilters {
  fromDate: string;
  toDate: string;
  branchId?: string;
  limit?: number;
}

export interface DashboardAnalyticsData {
  overview: DashboardOverviewResponse;
  revenueTrend: RevenueTrendResponse[];
  orderStatus: OrderStatusSummaryResponse[];
  topProducts: TopProductResponse[];
  branchPerformance: BranchPerformanceResponse[];
  availableBranches?: Branch[];
}

export interface DashboardDataResponse extends DashboardAnalyticsData {}