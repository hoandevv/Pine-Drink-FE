import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, TimeoutError, finalize, timeout, timer } from 'rxjs';

import { AccessControlService } from '../../../../core/services/access-control.service';
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

type ExportStatus = 'idle' | 'creating' | 'processing' | 'downloading' | 'success' | 'error';

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
  isExporting = false;
  isLoadingHistory = false;
  exportStatus: ExportStatus = 'idle';
  exportMessage = '';
  private activeExportJobId: string | null = null;
  private exportResetTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly downloadingJobIds = new Set<string>();
  private readonly autoDownloadJobIds = new Set<string>();
  private readonly reportActionTimeoutMs = 60000;

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
    private readonly toastService: ToastService,
    private readonly accessControl: AccessControlService
  ) {
    this.filterForm = this.fb.group({
      categoryId: [''],
      status: [''],
      fromDate: [''],
      toDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadReportStats();
    this.loadReportHistory();
  }

  ngOnDestroy(): void {
    this.pollSubs.forEach(sub => sub.unsubscribe());
    this.clearExportResetTimer();
  }

  goToHistoryPage(page: number): void {
    if (page < 0 || page >= this.historyTotalPages || page === this.historyPage || this.isLoadingHistory) return;
    this.loadReportHistory(page);
  }

  changeHistorySize(size: number | string): void {
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
    if (!this.isValidDateRange()) return;
    this.loadReportHistory(0);
  }

  resetFilter(): void {
    this.filterForm.reset({ categoryId: '', status: '', fromDate: '', toDate: '' });
    this.loadReportHistory(0);
  }

  get canCreateReport(): boolean {
    return this.accessControl.can('REPORT_CREATE');
  }

  createReport(): void {
    if (!this.canCreateReport) {
      this.toastService.error('Bạn không có quyền tạo báo cáo');
      return;
    }

    if (this.isExporting) return;

    this.isSubmitting = true;
    this.setExportState('creating', 'Đang tạo báo cáo...');
    this.toastService.info('Bắt đầu xuất báo cáo. Hệ thống đang tạo file trong nền.');

    const filters = this.filterForm.value;
    const request = {
      reportType: 'PRODUCT_CATALOG',
      fileFormat: this.selectedFormat,
      branchId: null,
      filters: JSON.stringify({
        status: filters.status || null,
        categoryId: filters.categoryId || null,
        fromDate: filters.fromDate || null,
        toDate: filters.toDate || null
      })
    };

    this.reportService.createJob(request)
      .pipe(
        timeout(this.reportActionTimeoutMs),
        finalize(() => (this.isSubmitting = false))
      )
      .subscribe({
        next: (job) => {
          this.activeExportJobId = job.id;
          this.setExportState('processing', 'Hệ thống đang tạo báo cáo, vui lòng không đóng trang.');
          this.toastService.success('Đã gửi yêu cầu xuất báo cáo. Hệ thống đang xử lý trong nền.');
          this.reportHistory.unshift(job);
          this.loadReportStats();
          this.autoDownloadJobIds.add(job.id);
          this.startPolling(job.id);
        },
        error: (error) => {
          this.setExportState('error', 'Xuất báo cáo thất bại');
          this.toastService.error(this.getReportErrorMessage(error, 'Không thể tạo báo cáo'));
          this.scheduleExportReset();
        }
      });
  }

  downloadReport(job: ReportJobResponse, fromAutoExport = false): void {
    if (job.status !== 'DONE' || this.isDownloading(job.id)) return;

    this.downloadingJobIds.add(job.id);
    if (fromAutoExport) {
      this.setExportState('downloading', 'Đang tải xuống báo cáo...');
    }

    this.reportService.downloadJob(job.id)
      .pipe(
        timeout(this.reportActionTimeoutMs),
        finalize(() => this.downloadingJobIds.delete(job.id))
      )
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `product-catalog-${job.id}.${job.fileFormat.toLowerCase()}`;
          link.click();
          URL.revokeObjectURL(url);
          this.toastService.success('Xuất báo cáo thành công. File đã được tải xuống.');
          if (fromAutoExport) {
            this.setExportState('success', 'Xuất báo cáo thành công');
            this.scheduleExportReset();
          }
        },
        error: (error) => {
          this.toastService.error(this.getReportErrorMessage(error, 'Không thể tải xuống báo cáo'));
          if (fromAutoExport) {
            this.setExportState('error', 'Xuất báo cáo thất bại');
            this.scheduleExportReset();
          }
        }
      });
  }

  isDownloading(jobId: string): boolean {
    return this.downloadingJobIds.has(jobId);
  }

  getExportButtonText(): string {
    const textMap: Record<ExportStatus, string> = {
      idle: 'Xuất báo cáo',
      creating: 'Đang tạo báo cáo...',
      processing: 'Đang tạo báo cáo...',
      downloading: 'Đang tải xuống...',
      success: 'Xuất báo cáo thành công',
      error: 'Xuất báo cáo thất bại'
    };
    return textMap[this.exportStatus];
  }

  shouldShowExportSpinner(): boolean {
    return this.exportStatus === 'creating' || this.exportStatus === 'processing' || this.exportStatus === 'downloading';
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
    const filters = this.filterForm.value;
    this.reportService.getJobHistory(page, this.historySize, filters.fromDate || null, filters.toDate || null).subscribe({
      next: (pageData) => {
        const normalizedPage = this.normalizeHistoryPage(pageData, page);

        this.historyPage = normalizedPage.page;
        this.historySize = normalizedPage.size;
        this.historyTotalElements = normalizedPage.totalElements;
        this.historyTotalPages = normalizedPage.totalPages;
        this.historyFirst = normalizedPage.first;
        this.historyLast = normalizedPage.last;
        this.reportHistory = normalizedPage.content;

        this.loadReportStats();
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
        this.updateQuickStatsFromHistoryFallback();
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

  private updateQuickStatsFromHistoryFallback(): void {
    this.quickStats[0].value = this.historyTotalElements || this.reportHistory.length;
    this.quickStats[1].value = this.reportHistory.filter(j => j.status === 'DONE').length;
    this.quickStats[2].value = this.reportHistory.filter(j => this.isJobInProgress(j.status)).length;
    this.quickStats[3].value = this.reportHistory.filter(j => j.status === 'FAILED').length;
  }

  private isValidDateRange(): boolean {
    const { fromDate, toDate } = this.filterForm.value;
    if (fromDate && toDate && fromDate > toDate) {
      this.toastService.warning('Từ ngày phải nhỏ hơn hoặc bằng Đến ngày');
      return false;
    }
    return true;
  }

  private loadReportStats(): void {
    this.reportService.getJobStats().subscribe({
      next: (stats) => {
        this.quickStats[0].value = stats.total;
        this.quickStats[1].value = stats.completed;
        this.quickStats[2].value = stats.running;
        this.quickStats[3].value = stats.failed;
      },
      error: () => this.updateQuickStatsFromHistoryFallback()
    });
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
              if (this.autoDownloadJobIds.delete(jobId)) {
                this.downloadReport(job, true);
              }
            } else {
              this.autoDownloadJobIds.delete(jobId);
              if (this.activeExportJobId === jobId) {
                this.setExportState('error', 'Xuất báo cáo thất bại');
                this.scheduleExportReset();
              }
              this.toastService.error(job.errorMessage || `Báo cáo ${jobId} thất bại`);
            }
            return;
          }

          if (!this.isJobInProgress(job.status) || attempts >= maxAttempts) {
            this.stopPolling(jobId);
            if (this.activeExportJobId === jobId) {
              this.setExportState('error', 'Xuất báo cáo thất bại');
              this.scheduleExportReset();
            }
            this.toastService.warning('Đã dừng theo dõi báo cáo. Vui lòng tải lại lịch sử để kiểm tra trạng thái mới nhất.');
          }
        },
        error: () => {
          this.stopPolling(jobId);
          if (this.activeExportJobId === jobId) {
            this.setExportState('error', 'Xuất báo cáo thất bại');
            this.scheduleExportReset();
          }
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
    this.loadReportStats();
  }

  private stopPolling(jobId: string): void {
    this.pollSubs.get(jobId)?.unsubscribe();
    this.pollSubs.delete(jobId);
  }

  private isJobInProgress(status: string): boolean {
    return status === 'RUNNING' || status === 'PENDING';
  }

  private setExportState(status: ExportStatus, message: string): void {
    this.clearExportResetTimer();
    this.exportStatus = status;
    this.exportMessage = message;
    this.isExporting = status === 'creating' || status === 'processing' || status === 'downloading';
  }

  private scheduleExportReset(): void {
    this.clearExportResetTimer();
    this.exportResetTimer = setTimeout(() => this.resetExportState(), 2500);
  }

  private resetExportState(): void {
    this.isExporting = false;
    this.exportStatus = 'idle';
    this.exportMessage = '';
    this.activeExportJobId = null;
  }

  private clearExportResetTimer(): void {
    if (!this.exportResetTimer) return;
    clearTimeout(this.exportResetTimer);
    this.exportResetTimer = null;
  }

  private getReportErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof TimeoutError) {
      return `${fallback}: quá thời gian phản hồi. Vui lòng thử lại sau.`;
    }

    const apiMessage = (error as { error?: { message?: string }; message?: string })?.error?.message
      || (error as { message?: string })?.message;

    return apiMessage || fallback;
  }
}
