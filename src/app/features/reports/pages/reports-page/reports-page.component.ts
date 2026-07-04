import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, timer } from 'rxjs';

import { ToastService } from '../../../../core/services/toast.service';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { Category } from '../../../categories/models/category.model';
import { CategoryService } from '../../../categories/services/category.service';
import { ReportJobResponse } from '../../models/report.model';
import { ReportService } from '../../services/report.service';

interface QuickStat {
  label: string;
  value: number;
  status: 'total' | 'completed' | 'running' | 'failed';
}

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.scss']
})
export class ReportsPageComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  categories: Category[] = [];
  reportHistory: ReportJobResponse[] = [];
  quickStats: QuickStat[] = [
    { label: 'Tổng báo cáo', value: 0, status: 'total' },
    { label: 'Hoàn thành', value: 0, status: 'completed' },
    { label: 'Đang xử lý', value: 0, status: 'running' },
    { label: 'Thất bại', value: 0, status: 'failed' }
  ];

  selectedFormat: 'PDF' | 'XLSX' = 'PDF';
  isSubmitting = false;
  isLoadingHistory = false;

  historyPage = 0;
  historySize = 10;
  historyTotalElements = 0;
  historyTotalPages = 0;
  historyFirst = true;
  historyLast = true;

  private pollSubs: Map<string, Subscription> = new Map();

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportService: ReportService,
    private readonly categoryService: CategoryService,
    private readonly toastService: ToastService
  ) {
    this.filterForm = this.fb.group({
      categoryId: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadReportHistory();
  }

  ngOnDestroy(): void {
    this.pollSubs.forEach(sub => sub.unsubscribe());
  }

  goToHistoryPage(page: number): void {
    if (page < 0 || page >= this.historyTotalPages || page === this.historyPage || this.isLoadingHistory) return;
    this.loadReportHistory(page);
  }

  changeHistorySize(size: string): void {
    this.historySize = Number(size);
    this.loadReportHistory(0);
  }

  getHistoryRangeLabel(): string {
    if (this.historyTotalElements === 0) return '0 báo cáo';
    const start = this.historyPage * this.historySize + 1;
    const end = Math.min(start + this.reportHistory.length - 1, this.historyTotalElements);
    return `${start}-${end} / ${this.historyTotalElements} báo cáo`;
  }

  applyFilter(): void {
    this.loadReportHistory(0);
  }

  resetFilter(): void {
    this.filterForm.reset({ categoryId: '', status: '' });
    this.loadReportHistory(0);
  }

  createReport(): void {
    this.isSubmitting = true;

    const filters = this.filterForm.value;
    const request = {
      reportType: 'PRODUCT_CATALOG',
      fileFormat: this.selectedFormat,
      branchId: null,
      filters: JSON.stringify({
        status: filters.status || null,
        categoryId: filters.categoryId || null
      })
    };

    this.reportService.createJob(request).subscribe({
      next: (job) => {
        this.toastService.success('Đã tạo báo cáo. Báo cáo sẽ được xử lý trong nền.');
        this.reportHistory.unshift(job);
        this.updateQuickStats();
        this.startPolling(job.id);
        this.isSubmitting = false;
      },
      error: () => {
        this.toastService.error('Không thể tạo báo cáo');
        this.isSubmitting = false;
      }
    });
  }

  downloadReport(job: ReportJobResponse): void {
    if (job.status !== 'DONE') return;

    this.reportService.downloadJob(job.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `product-catalog-${job.id}.${job.fileFormat.toLowerCase()}`;
        link.click();
        URL.revokeObjectURL(url);
        this.toastService.success('Đã tải xuống báo cáo');
      },
      error: () => {
        this.toastService.error('Không thể tải xuống báo cáo');
      }
    });
  }

  retryReport(job: ReportJobResponse): void {
    if (job.status !== 'FAILED') return;
    // Implementation would re-submit with same parameters
    this.toastService.info('Tính năng đang phát triển');
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'badge-pending',
      RUNNING: 'badge-running',
      DONE: 'badge-completed',
      FAILED: 'badge-failed'
    };
    return statusMap[status] || 'badge-pending';
  }

  getStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      RUNNING: 'Đang xử lý',
      DONE: 'Hoàn thành',
      FAILED: 'Thất bại'
    };
    return labelMap[status] || status;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private loadCategories(): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories = categories;
      },
      error: () => this.toastService.warning('Không tải được danh sách danh mục')
    });
  }

  private loadReportHistory(page = this.historyPage): void {
    this.isLoadingHistory = true;
    this.reportService.getJobHistory(page, this.historySize).subscribe({
      next: (pageData) => {
        const normalizedPage = this.normalizeHistoryPage(pageData, page);

        this.historyPage = normalizedPage.page;
        this.historySize = normalizedPage.size;
        this.historyTotalElements = normalizedPage.totalElements;
        this.historyTotalPages = normalizedPage.totalPages;
        this.historyFirst = normalizedPage.first;
        this.historyLast = normalizedPage.last;
        this.reportHistory = normalizedPage.content;

        this.updateQuickStats();
        this.isLoadingHistory = false;

        this.reportHistory
          .filter(job => job.status === 'RUNNING' || job.status === 'PENDING')
          .forEach(job => this.startPolling(job.id));
      },
      error: () => {
        this.reportHistory = [];
        this.historyTotalElements = 0;
        this.historyTotalPages = 0;
        this.historyFirst = true;
        this.historyLast = true;
        this.updateQuickStats();
        this.isLoadingHistory = false;
        this.toastService.error('Không thể tải lịch sử báo cáo');
      }
    });
  }

  private normalizeHistoryPage(
    pageData: PageResponse<ReportJobResponse> | null | undefined,
    fallbackPage: number
  ): PageResponse<ReportJobResponse> {
    const content = Array.isArray(pageData?.content) ? pageData?.content ?? [] : [];
    return {
      content,
      page: pageData?.page ?? fallbackPage,
      size: pageData?.size ?? this.historySize,
      totalElements: pageData?.totalElements ?? content.length,
      totalPages: pageData?.totalPages ?? (content.length ? 1 : 0),
      first: pageData?.first ?? fallbackPage === 0,
      last: pageData?.last ?? true
    };
  }

  private updateQuickStats(): void {
    this.quickStats[0].value = this.historyTotalElements || this.reportHistory.length;
    this.quickStats[1].value = this.reportHistory.filter(j => j.status === 'DONE').length;
    this.quickStats[2].value = this.reportHistory.filter(j => this.isJobInProgress(j.status)).length;
    this.quickStats[3].value = this.reportHistory.filter(j => j.status === 'FAILED').length;
  }

  private startPolling(jobId: string): void {
    if (this.pollSubs.has(jobId)) return;

    let attempts = 0;
    const maxAttempts = 40;

    const sub = timer(0, 3000).subscribe(() => {
      attempts += 1;
      this.reportService.getJob(jobId).subscribe({
        next: (job) => {
          this.upsertReportJob(job);

          if (job.status === 'DONE' || job.status === 'FAILED') {
            this.stopPolling(jobId);

            if (job.status === 'DONE') {
              this.toastService.success(`Báo cáo ${jobId} đã hoàn thành`);
            } else {
              this.toastService.error(job.errorMessage || `Báo cáo ${jobId} thất bại`);
            }
            return;
          }

          if (!this.isJobInProgress(job.status) || attempts >= maxAttempts) {
            this.stopPolling(jobId);
            this.toastService.warning('Đã dừng theo dõi báo cáo. Vui lòng tải lại lịch sử để kiểm tra trạng thái mới nhất.');
          }
        },
        error: () => {
          this.stopPolling(jobId);
          this.toastService.warning('Không thể cập nhật trạng thái báo cáo. Đã dừng tự động theo dõi.');
        }
      });
    });

    this.pollSubs.set(jobId, sub);
  }

  private upsertReportJob(job: ReportJobResponse): void {
    const index = this.reportHistory.findIndex(j => j.id === job.id);
    if (index !== -1) {
      this.reportHistory[index] = job;
    } else {
      this.reportHistory.unshift(job);
    }
    this.updateQuickStats();
  }

  private stopPolling(jobId: string): void {
    this.pollSubs.get(jobId)?.unsubscribe();
    this.pollSubs.delete(jobId);
  }

  private isJobInProgress(status: string): boolean {
    return status === 'RUNNING' || status === 'PENDING';
  }
}
