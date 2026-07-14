import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';

import { Branch } from '../../../branches/models/branch.model';
import {
  BranchPerformanceResponse,
  DashboardAnalyticsData,
  DashboardFilters,
  DashboardOverviewResponse,
  OrderStatusSummaryResponse,
  RevenueTrendResponse,
  TopProductResponse
} from '../../models/dashboard-analytics.model';
import { DashboardAnalyticsService } from '../../services/dashboard-analytics.service';

interface MetricCard {
  title: string;
  value: string;
  delta: string;
  description: string;
  icon: string;
  tone: 'green' | 'yellow' | 'mint' | 'orange';
}

interface OrderStatusGroup {
  label: string;
  count: number;
  percent: number;
  color: string;
}

type RevenuePeriod = '7days' | '30days' | 'month';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
  today = this.formatDateInput(new Date());
  fromDate = this.formatDateInput(this.addDays(new Date(), -6));
  toDate = this.today;
  selectedBranchId = '';
  topProductLimit = 10;
  selectedRevenuePeriod: RevenuePeriod = '7days';

  branches: Branch[] = [];
  isLoading = false;
  errorMessage = '';

  overview: DashboardOverviewResponse = {
    totalRevenue: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    newCustomers: 0
  };
  revenueTrend: RevenueTrendResponse[] = [];
  orderStatus: OrderStatusSummaryResponse[] = [];
  topProducts: TopProductResponse[] = [];
  branchPerformance: BranchPerformanceResponse[] = [];

  constructor(private readonly dashboardAnalyticsService: DashboardAnalyticsService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get metrics(): MetricCard[] {
    return [
      {
        title: 'Tổng doanh thu',
        value: this.formatCurrencyShort(this.overview.totalRevenue),
        delta: '+12% so với kỳ trước',
        description: 'Ghi nhận từ các đơn hoàn tất',
        icon: 'payments',
        tone: 'green'
      },
      {
        title: 'Đơn hoàn tất',
        value: this.formatNumber(this.overview.completedOrders),
        delta: `${this.formatNumber(this.overview.cancelledOrders)} đơn hủy`,
        description: 'Tổng số đơn đã hoàn thành',
        icon: 'receipt_long',
        tone: 'yellow'
      },
      {
        title: 'Giá trị đơn TB',
        value: this.formatCurrencyShort(this.overview.averageOrderValue),
        delta: 'AOV đơn hoàn tất',
        description: 'Doanh thu trung bình mỗi đơn',
        icon: 'monitoring',
        tone: 'mint'
      },
      {
        title: 'Khách mới',
        value: this.formatNumber(this.overview.newCustomers),
        delta: '+8% hồ sơ mới',
        description: 'Theo ngày tạo tài khoản',
        icon: 'group_add',
        tone: 'orange'
      }
    ];
  }

  get maxRevenue(): number {
    return Math.max(...this.revenueTrend.map((item) => item.revenue), 1);
  }

  get maxStatusCount(): number {
    return Math.max(...this.orderStatus.map((item) => item.count), 1);
  }

  get maxTopProductRevenue(): number {
    return Math.max(...this.topProducts.map((item) => item.revenue), 1);
  }

  get totalStatusCount(): number {
    return this.orderStatus.reduce((total, item) => total + (item.count || 0), 0);
  }

  get revenueAxisLabels(): string[] {
    const max = this.maxRevenue;
    return [max, max * 0.66, max * 0.33, 0].map((value) => this.formatCurrencyShort(value));
  }

  get revenueAreaPath(): string {
    const points = this.getRevenueChartCoordinates();
    if (!points.length) {
      return '';
    }

    return `${this.buildSmoothPath(points)} L 100,100 L 0,100 Z`;
  }

  get revenueLinePath(): string {
    return this.buildSmoothPath(this.getRevenueChartCoordinates());
  }

  get revenueChartCoordinates(): Array<{ x: number; y: number; item: RevenueTrendResponse }> {
    return this.getRevenueChartCoordinates();
  }

  get revenuePeak(): RevenueTrendResponse | null {
    return this.revenueTrend.reduce<RevenueTrendResponse | null>((peak, item) => {
      if (!peak || item.revenue > peak.revenue) {
        return item;
      }
      return peak;
    }, null);
  }

  get groupedOrderStatus(): OrderStatusGroup[] {
    const counts = { preparing: 0, completed: 0, cancelled: 0 };
    this.orderStatus.forEach((item) => {
      const status = (item.status || '').toUpperCase();
      if (['COMPLETED', 'DELIVERED'].includes(status)) {
        counts.completed += item.count || 0;
      } else if (['CANCELLED', 'REJECTED', 'FAILED'].includes(status)) {
        counts.cancelled += item.count || 0;
      } else {
        counts.preparing += item.count || 0;
      }
    });
    const total = counts.preparing + counts.completed + counts.cancelled;
    return [
      { label: 'Đang chuẩn bị', count: counts.preparing, color: '#d8b12d' },
      { label: 'Hoàn tất', count: counts.completed, color: '#2f6f45' },
      { label: 'Đã huỷ/Từ chối', count: counts.cancelled, color: '#9b443d' }
    ].map((item) => ({ ...item, percent: total ? (item.count / total) * 100 : 0 }));
  }

  get orderStatusDoughnut(): string {
    let cursor = 0;
    const segments = this.groupedOrderStatus.map((item) => {
      const start = cursor;
      cursor += item.percent;
      return `${item.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });
    return this.totalStatusCount ? `conic-gradient(${segments.join(', ')})` : 'conic-gradient(#edf1eb 0 100%)';
  }

  selectRevenuePeriod(period: RevenuePeriod): void {
    this.selectedRevenuePeriod = period;
    const now = new Date();
    const start = period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : this.addDays(now, period === '30days' ? -29 : -6);
    this.fromDate = this.formatDateInput(start);
    this.toDate = this.formatDateInput(now);
    this.loadDashboard();
  }

  showRevenueAxisLabel(index: number): boolean {
    const length = this.revenueTrend.length;
    const interval = length > 14 ? 5 : length > 7 ? 2 : 1;
    return index === 0 || index === length - 1 || index % interval === 0;
  }

  loadDashboard(): void {
    if (!this.fromDate || !this.toDate) {
      this.errorMessage = 'Vui lòng chọn đủ từ ngày và đến ngày.';
      return;
    }

    if (this.fromDate > this.toDate) {
      this.errorMessage = 'Từ ngày không được lớn hơn đến ngày.';
      return;
    }

    const filters: DashboardFilters = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      branchId: this.selectedBranchId || undefined,
      limit: this.topProductLimit
    };

    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardAnalyticsService
      .getAnalytics(filters)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (data) => this.applyDashboardData(data),
        error: () => {
          this.errorMessage = 'Không tải được dữ liệu dashboard. Kiểm tra backend hoặc quyền REPORT_VIEW.';
          this.applyDashboardData({
            overview: this.overview,
            revenueTrend: [],
            orderStatus: [],
            topProducts: [],
            branchPerformance: []
          });
        }
      });
  }

  resetFilters(): void {
    this.fromDate = this.formatDateInput(this.addDays(new Date(), -6));
    this.toDate = this.today;
    this.selectedBranchId = '';
    this.topProductLimit = 10;
    this.loadDashboard();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
  }

  formatCurrencyShort(value: number): string {
    const amount = value || 0;
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${Math.round(amount / 1000)}K`;
    }
    return this.formatNumber(amount);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value || 0);
  }

  getRevenueHeight(item: RevenueTrendResponse): number {
    return Math.max((item.revenue / this.maxRevenue) * 100, item.revenue > 0 ? 8 : 2);
  }

  getRevenuePointLabel(item: RevenueTrendResponse): string {
    return `${this.formatDateLabel(item.date)} · ${this.formatCurrency(item.revenue)} · ${this.formatNumber(item.orders)} đơn hàng`;
  }

  getStatusPercent(item: OrderStatusSummaryResponse): number {
    return Math.max((item.count / this.maxStatusCount) * 100, item.count > 0 ? 8 : 2);
  }

  getProductPercent(item: TopProductResponse): number {
    return Math.max((item.revenue / this.maxTopProductRevenue) * 100, item.revenue > 0 ? 8 : 2);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      CONFIRMED: 'Đang chuẩn bị',
      PREPARING: 'Đang chuẩn bị',
      READY_FOR_PICKUP: 'Đang chuẩn bị',
      SHIPPING: 'Đang giao',
      DELIVERING: 'Đang giao',
      COMPLETED: 'Hoàn tất',
      DELIVERED: 'Hoàn tất',
      CANCELLED: 'Đã hủy/Từ chối',
      REJECTED: 'Đã hủy/Từ chối',
      FAILED: 'Đã hủy/Từ chối'
    };
    return labels[status] || 'Khác';
  }

  getStatusTone(status: string): string {
    const tones: Record<string, string> = {
      PREPARING: 'is-preparing',
      CONFIRMED: 'is-preparing',
      READY_FOR_PICKUP: 'is-preparing',
      SHIPPING: 'is-delivering',
      DELIVERING: 'is-delivering',
      COMPLETED: 'is-completed',
      DELIVERED: 'is-completed',
      CANCELLED: 'is-cancelled',
      REJECTED: 'is-cancelled',
      FAILED: 'is-cancelled'
    };
    return tones[status] || 'is-neutral';
  }

  getBranchBadge(branch: BranchPerformanceResponse): string {
    if (!branch.revenue && !branch.completedOrders) {
      return 'Chưa có dữ liệu';
    }
    return branch.cancelledOrders > branch.completedOrders ? 'Cần theo dõi' : 'Hoạt động tốt';
  }


  private applyDashboardData(data: DashboardAnalyticsData): void {
    this.overview = data.overview || this.overview;
    this.revenueTrend = this.normalizeRevenueTrend(data.revenueTrend || []);
    this.orderStatus = data.orderStatus || [];
    this.topProducts = data.topProducts || [];
    this.branchPerformance = data.branchPerformance || [];
    this.branches = data.availableBranches || [];
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateLabel(date: string): string {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(date));
  }

  private getRevenueChartCoordinates(): Array<{ x: number; y: number; item: RevenueTrendResponse }> {
    const max = this.maxRevenue;
    const lastIndex = Math.max(this.revenueTrend.length - 1, 1);

    return this.revenueTrend.map((item, index) => ({
      // Keep edge points inside the plot so their markers are not clipped.
      x: Number((1 + (index / lastIndex) * 98).toFixed(2)),
      y: Number(Math.min(98, 100 - (item.revenue / max) * 88).toFixed(2)),
      item
    }));
  }

  private buildSmoothPath(points: Array<{ x: number; y: number }>): string {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
    let path = `M ${points[0].x},${points[0].y}`;
    for (let index = 0; index < points.length - 1; index++) {
      const current = points[index];
      const next = points[index + 1];
      const controlX = (current.x + next.x) / 2;
      path += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
    }
    return path;
  }

  private normalizeRevenueTrend(items: RevenueTrendResponse[]): RevenueTrendResponse[] {
    const byDate = new Map(items.map((item) => [item.date.slice(0, 10), item]));
    const result: RevenueTrendResponse[] = [];
    const cursor = new Date(`${this.fromDate}T00:00:00`);
    const end = new Date(`${this.toDate}T00:00:00`);
    while (cursor <= end) {
      const date = this.formatDateInput(cursor);
      result.push(byDate.get(date) || { date, revenue: 0, orders: 0, averageOrderValue: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }
}
