import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription, timer } from 'rxjs';

import { ToastService } from '../../../../core/services/toast.service';
import { Branch } from '../../../branches/models/branch.model';
import { BranchService } from '../../../branches/services/branch.service';
import { ReportJobResponse, ReportType } from '../../models/report.model';
import { ReportService } from '../../services/report.service';

interface ReportPreset {
  type: ReportType;
  title: string;
  description: string;
  icon: string;
  accent: string;
  fields: string[];
}

@Component({ selector: 'app-reports-page', templateUrl: './reports-page.component.html', styleUrls: ['./reports-page.component.scss'] })
export class ReportsPageComponent implements OnInit, OnDestroy {
  readonly presets: ReportPreset[] = [
    {
      type: 'INVOICE',
      title: 'Invoice PDF',
      description: 'Xuất hóa đơn theo mã đơn hàng, xử lý nền qua job queue.',
      icon: 'receipt_long',
      accent: 'emerald',
      fields: ['orderCode']
    },
    {
      type: 'DAILY_REVENUE',
      title: 'Daily revenue',
      description: 'Báo cáo doanh thu theo chi nhánh và khoảng ngày.',
      icon: 'monitoring',
      accent: 'amber',
      fields: ['branchId', 'fromDate', 'toDate']
    },
    {
      type: 'PRODUCT_CATALOG',
      title: 'Product catalog',
      description: 'Danh mục sản phẩm theo trạng thái và danh mục.',
      icon: 'inventory_2',
      accent: 'blue',
      fields: ['status', 'categoryId']
    }
  ];

  readonly quickStats = [
    { label: 'PDF async', value: 'Queue', hint: 'không khóa UI' },
    { label: 'Polling', value: '2s', hint: 'tự kiểm tra trạng thái' },
    { label: 'Secure', value: 'Auth', hint: 'download qua BE' }
  ];

  selectedType: ReportType = 'INVOICE';
  branches: Branch[] = [];
  currentJob: ReportJobResponse | null = null;
  isSubmitting = false;
  isDownloading = false;

  readonly form = this.fb.group({
    orderCode: ['', Validators.required],
    branchId: [''],
    fromDate: [this.toDateInput(new Date()), Validators.required],
    toDate: [this.toDateInput(new Date()), Validators.required],
    status: [''],
    categoryId: ['']
  });

  private pollSub?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportService: ReportService,
    private readonly branchService: BranchService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  get selectedPreset(): ReportPreset {
    return this.presets.find((preset) => preset.type === this.selectedType) || this.presets[0];
  }

  get progressPercent(): number {
    if (!this.currentJob) { return 0; }
    if (this.currentJob.status === 'DONE') { return 100; }
    if (this.currentJob.status === 'RUNNING') { return 68; }
    if (this.currentJob.status === 'FAILED') { return 100; }
    return 28;
  }

  selectPreset(type: ReportType): void {
    this.selectedType = type;
    this.currentJob = null;
    this.pollSub?.unsubscribe();

    const orderCodeControl = this.form.controls.orderCode;
    const branchControl = this.form.controls.branchId;
    const statusControl = this.form.controls.status;
    const categoryControl = this.form.controls.categoryId;
    
    if (type === 'INVOICE') {
      orderCodeControl.setValidators([Validators.required]);
      branchControl.clearValidators();
      statusControl.clearValidators();
      categoryControl.clearValidators();
    } else if (type === 'DAILY_REVENUE') {
      orderCodeControl.clearValidators();
      branchControl.setValidators([Validators.required]);
      statusControl.clearValidators();
      categoryControl.clearValidators();
    } else if (type === 'PRODUCT_CATALOG') {
      orderCodeControl.clearValidators();
      branchControl.clearValidators();
      statusControl.clearValidators();
      categoryControl.clearValidators();
    }
    
    orderCodeControl.updateValueAndValidity();
    branchControl.updateValueAndValidity();
    statusControl.updateValueAndValidity();
    categoryControl.updateValueAndValidity();
  }

  createReport(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.warning('Vui lòng nhập đủ thông tin báo cáo');
      return;
    }

    this.isSubmitting = true;
    this.currentJob = null;

    const request = this.buildRequest();
    this.reportService.createJob(request).subscribe({
      next: (job) => {
        this.currentJob = job;
        this.toastService.info('Đang tạo báo cáo, hệ thống sẽ tự cập nhật trạng thái');
        this.startPolling(job.id);
      },
      error: () => {
        this.toastService.error('Không thể tạo job báo cáo');
        this.isSubmitting = false;
      }
    });
  }

  downloadReport(): void {
    if (!this.currentJob || this.currentJob.status !== 'DONE') { return; }
    this.isDownloading = true;
    this.reportService.downloadJob(this.currentJob.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.getDownloadFileName(this.currentJob!);
        link.click();
        URL.revokeObjectURL(url);
        this.toastService.success('Đã tải báo cáo');
        this.isDownloading = false;
      },
      error: () => {
        this.toastService.error('Không thể tải báo cáo');
        this.isDownloading = false;
      }
    });
  }

  private startPolling(jobId: string): void {
    this.pollSub?.unsubscribe();
    this.pollSub = timer(0, 2000).subscribe(() => {
      this.reportService.getJob(jobId).subscribe({
        next: (job) => {
          this.currentJob = job;
          if (job.status === 'DONE' || job.status === 'FAILED') {
            this.isSubmitting = false;
            this.pollSub?.unsubscribe();
            if (job.status === 'DONE') {
              this.toastService.success('Báo cáo đã sẵn sàng, đang tải xuống...');
              this.downloadReport();
            } else {
              this.toastService.error(job.errorMessage || 'Tạo báo cáo thất bại');
            }
          }
        },
        error: () => {
          this.isSubmitting = false;
          this.pollSub?.unsubscribe();
          this.toastService.error('Không thể kiểm tra trạng thái báo cáo');
        }
      });
    });
  }

  private buildRequest() {
    const raw = this.form.getRawValue();
    if (this.selectedType === 'INVOICE') {
      return {
        reportType: 'INVOICE',
        fileFormat: 'PDF',
        filters: JSON.stringify({ orderCode: raw.orderCode?.trim() })
      };
    }

    if (this.selectedType === 'DAILY_REVENUE') {
      return {
        reportType: 'DAILY_REVENUE',
        fileFormat: 'PDF',
        branchId: raw.branchId || null,
        filters: JSON.stringify({ fromDate: raw.fromDate, toDate: raw.toDate })
      };
    }

    if (this.selectedType === 'PRODUCT_CATALOG') {
      return {
        reportType: 'PRODUCT_CATALOG',
        fileFormat: 'PDF',
        filters: JSON.stringify({ 
          status: raw.status || null,
          categoryId: raw.categoryId || null
        })
      };
    }

    throw new Error('Unknown report type');
  }

  private loadBranches(): void {
    this.branchService.getActiveBranches(0, 100).subscribe({
      next: (page) => {
        this.branches = page.content || [];
        if (!this.form.controls.branchId.value && this.branches.length) {
          this.form.controls.branchId.setValue(this.branches[0].id);
        }
      },
      error: () => this.toastService.warning('Không tải được danh sách chi nhánh')
    });
  }

  private getDownloadFileName(job: ReportJobResponse): string {
    return `${job.reportType.toLowerCase()}-${job.id}.pdf`;
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
