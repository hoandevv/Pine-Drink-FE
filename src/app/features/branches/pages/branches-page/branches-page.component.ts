import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { BranchCreateRequest } from '../../models/branch-request.model';
import { BranchHours } from '../../models/branch-hours.model';
import { Branch } from '../../models/branch.model';
import { BranchService } from '../../services/branch.service';
import { MapPickerResult } from '../../../../features/client/components/map-picker/map-picker.component';
import { AccessControlService } from '../../../../core/services/access-control.service';

@Component({
  selector: 'app-branches-page',
  templateUrl: './branches-page.component.html',
  styleUrls: ['./branches-page.component.scss']
})
export class BranchesPageComponent implements OnInit {
  readonly filterForm = this.formBuilder.nonNullable.group({
    keyword: [''],
    status: ['']
  });

  readonly branchForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
    phone: [''],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    latitude: [null as number | null, [Validators.required]],
    longitude: [null as number | null, [Validators.required]],
    supportsPickup: [true],
    supportsDelivery: [false],
    averagePreparationMinutes: [15, [Validators.required, Validators.min(1), Validators.max(180)]]
  });

  readonly branchHoursForm = this.formBuilder.nonNullable.group({
    dayOfWeek: [1, [Validators.required, Validators.min(1), Validators.max(7)]],
    openTime: ['07:00', [Validators.required]],
    closeTime: ['22:30', [Validators.required]],
    closed: [false]
  });

  readonly statusOptions = ['ALL', 'ACTIVE', 'INACTIVE', 'MAINTENANCE'];
  readonly dayOptions = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 7, label: 'Chủ nhật' }
  ];
  readonly schedulePresets = [
    { label: 'Áp dụng T2 - T7', days: [1, 2, 3, 4, 5, 6] },
    { label: 'Áp dụng cả tuần', days: [1, 2, 3, 4, 5, 6, 7] },
    { label: 'Cuối tuần', days: [6, 7] }
  ];

  branches: Branch[] = [];
  loading = false;
  saving = false;
  formOpen = false;
  editingBranch: Branch | null = null;
  branchHours: BranchHours[] = [];
  editingBranchHours: BranchHours | null = null;
  loadingHours = false;
  savingHours = false;
  branchHoursByBranchId: Record<string, BranchHours[]> = {};
  pageSizeOptions = [5, 10, 20, 50];
  pageData: PageResponse<Branch> = {
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true
  };

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly branchService: BranchService,
    public readonly accessControl: AccessControlService
  ) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  get activeCount(): number {
    return this.branches.filter((branch) => branch.status === 'ACTIVE').length;
  }

  get maintenanceCount(): number {
    return this.branches.filter((branch) => branch.status === 'MAINTENANCE').length;
  }

  search(): void {
    this.loadBranches(0);
  }

  reset(): void {
    this.filterForm.reset({ keyword: '', status: '' });
    this.loadBranches(0);
  }

  onPageChange(page: number): void {
    this.loadBranches(page);
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.pageData.totalPages || page === this.pageData.page) {
      return;
    }

    this.loadBranches(page);
  }

  changePageSize(size: string | number): void {
    this.pageData = {
      ...this.pageData,
      size: Number(size),
      page: 0
    };
    this.loadBranches(0);
  }

  openCreateForm(): void {
    if (!this.accessControl.can('BRANCH_CREATE')) {
      return;
    }

    this.editingBranch = null;
    this.formOpen = true;
    this.branchHours = [];
    this.resetBranchHoursForm();
    this.branchForm.reset({
      name: '',
      address: '',
      phone: '',
      email: '',
      latitude: null,
      longitude: null,
      supportsPickup: true,
      supportsDelivery: false,
      averagePreparationMinutes: 15
    });
  }

  openEditForm(branch: Branch): void {
    if (!this.accessControl.can('BRANCH_UPDATE')) {
      return;
    }

    this.editingBranch = branch;
    this.formOpen = true;
    this.resetBranchHoursForm();
    this.loadBranchHours(branch.id);
    this.branchForm.patchValue({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      latitude: branch.latitude ?? null,
      longitude: branch.longitude ?? null,
      supportsPickup: branch.supportsPickup ?? true,
      supportsDelivery: branch.supportsDelivery ?? false,
      averagePreparationMinutes: branch.averagePreparationMinutes || 15
    });
  }

  closeForm(): void {
    this.formOpen = false;
    this.editingBranch = null;
    this.branchHours = [];
    this.editingBranchHours = null;
  }

  saveBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    const request = this.buildRequest();
    const action$ = this.editingBranch
      ? this.branchService.updateBranch(this.editingBranch.id, request)
      : this.branchService.createBranch(request);

    this.saving = true;
    action$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (branch) => {
          if (this.editingBranch || this.branchHours.length === 0) {
            this.closeForm();
            this.loadBranches(this.pageData.page);
            return;
          }

          this.createInitialBranchHours(branch.id);
        }
      });
  }

  closeBranch(branch: Branch): void {
    if (!window.confirm(`Đóng chi nhánh ${branch.name}?`)) {
      return;
    }

    this.branchService.closeBranch(branch.id).subscribe({
      next: () => this.loadBranches(this.pageData.page)
    });
  }

  restoreBranch(branch: Branch): void {
    if (!window.confirm(`Mở lại chi nhánh ${branch.name}?`)) {
      return;
    }

    this.branchService.restoreBranch(branch.id).subscribe({
      next: () => this.loadBranches(this.pageData.page)
    });
  }

  onLocationSelected(location: MapPickerResult): void {
    this.branchForm.patchValue({
      address: location.addressLine || location.displayName || this.branchForm.controls.address.value,
      latitude: location.latitude,
      longitude: location.longitude
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Đang hoạt động',
      INACTIVE: 'Tạm ngưng',
      MAINTENANCE: 'Bảo trì'
    };
    return labels[status] || status;
  }

  dayLabel(dayOfWeek: number): string {
    return this.dayOptions.find((day) => day.value === dayOfWeek)?.label || `Ngày ${dayOfWeek}`;
  }

  hasBranchHours(dayOfWeek: number): boolean {
    return this.branchHours.some((hours) => hours.dayOfWeek === dayOfWeek);
  }

  branchHoursSummary(branch: Branch): string {
    const hours = this.branchHoursByBranchId[branch.id] || [];
    if (hours.length === 0) {
      return 'Chưa có lịch';
    }

    const openDays = hours.filter((item) => !item.closed);
    if (openDays.length === 0) {
      return 'Đóng cả tuần';
    }

    const first = openDays[0];
    const sameTime = openDays.every((item) => item.openTime === first.openTime && item.closeTime === first.closeTime);
    const dayText = this.compactDayRange(openDays.map((item) => item.dayOfWeek));
    const timeText = sameTime ? `${this.normalizeTime(first.openTime)} - ${this.normalizeTime(first.closeTime)}` : 'Nhiều khung giờ';
    return `${dayText} · ${timeText}`;
  }

  editBranchHours(hours: BranchHours): void {
    this.editingBranchHours = hours;
    this.branchHoursForm.patchValue({
      dayOfWeek: hours.dayOfWeek,
      openTime: this.normalizeTime(hours.openTime),
      closeTime: this.normalizeTime(hours.closeTime),
      closed: hours.closed
    });
  }

  resetBranchHoursForm(): void {
    this.editingBranchHours = null;
    this.branchHoursForm.reset({ dayOfWeek: 1, openTime: '07:00', closeTime: '22:30', closed: false });
  }

  saveBranchHours(): void {
    if (!this.editingBranch || this.branchHoursForm.invalid) {
      this.branchHoursForm.markAllAsTouched();
      return;
    }

    const value = this.branchHoursForm.getRawValue();
    const request = {
      dayOfWeek: value.dayOfWeek,
      openTime: value.openTime,
      closeTime: value.closeTime,
      closed: value.closed
    };
    const existingHours = this.branchHours.find((hours) => hours.dayOfWeek === value.dayOfWeek);
    const action$ = this.editingBranchHours || existingHours
      ? this.branchService.updateBranchHours(this.editingBranch.id, (this.editingBranchHours || existingHours)!.id, request)
      : this.branchService.createBranchHours(this.editingBranch.id, request);

    this.savingHours = true;
    action$.pipe(finalize(() => (this.savingHours = false))).subscribe({
      next: () => {
        this.resetBranchHoursForm();
        this.loadBranchHours(this.editingBranch!.id);
      }
    });
  }

  applySchedulePreset(days: number[]): void {
    if (this.branchHoursForm.invalid) {
      this.branchHoursForm.markAllAsTouched();
      return;
    }

    if (!this.editingBranch) {
      this.applyLocalSchedulePreset(days);
      return;
    }

    const value = this.branchHoursForm.getRawValue();
    const actions = days.map((dayOfWeek) => {
      const request = {
        dayOfWeek,
        openTime: value.openTime,
        closeTime: value.closeTime,
        closed: value.closed
      };
      const existingHours = this.branchHours.find((hours) => hours.dayOfWeek === dayOfWeek);
      return existingHours
        ? this.branchService.updateBranchHours(this.editingBranch!.id, existingHours.id, request)
        : this.branchService.createBranchHours(this.editingBranch!.id, request);
    });

    this.savingHours = true;
    forkJoin(actions).pipe(finalize(() => (this.savingHours = false))).subscribe({
      next: () => {
        this.resetBranchHoursForm();
        this.loadBranchHours(this.editingBranch!.id);
      }
    });
  }

  deleteBranchHours(hours: BranchHours): void {
    if (!this.editingBranch || !window.confirm(`Xóa giờ mở cửa ${this.dayLabel(hours.dayOfWeek)}?`)) {
      return;
    }

    this.branchService.deleteBranchHours(this.editingBranch.id, hours.id).subscribe({
      next: () => this.loadBranchHours(this.editingBranch!.id)
    });
  }

  loadBranches(page = 0): void {
    const filters = this.filterForm.getRawValue();
    const status = filters.status === 'ALL' ? '' : filters.status;

    this.loading = true;
    this.branchService
      .getBranches(page, this.pageData.size, filters.keyword.trim(), status)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pageData) => {
          this.pageData = pageData;
          this.branches = pageData.content;
          this.loadBranchHoursSummary(this.branches);
        }
      });
  }

  private loadBranchHours(branchId: string): void {
    this.loadingHours = true;
    this.branchService.getBranchHours(branchId)
      .pipe(finalize(() => (this.loadingHours = false)))
      .subscribe({
        next: (hours) => {
          this.branchHours = hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        }
      });
  }

  private normalizeTime(value: string): string {
    return value?.slice(0, 5) || '07:00';
  }

  private applyLocalSchedulePreset(days: number[]): void {
    const value = this.branchHoursForm.getRawValue();
    const nextHours = this.branchHours.filter((hours) => !days.includes(hours.dayOfWeek));
    const presetHours = days.map((dayOfWeek) => ({
      id: `draft-${dayOfWeek}`,
      branchId: 'draft',
      dayOfWeek,
      openTime: value.openTime,
      closeTime: value.closeTime,
      closed: value.closed
    }));
    this.branchHours = [...nextHours, ...presetHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  private createInitialBranchHours(branchId: string): void {
    const actions = this.branchHours.map((hours) => this.branchService.createBranchHours(branchId, {
      dayOfWeek: hours.dayOfWeek,
      openTime: this.normalizeTime(hours.openTime),
      closeTime: this.normalizeTime(hours.closeTime),
      closed: hours.closed
    }));

    this.savingHours = true;
    forkJoin(actions).pipe(finalize(() => (this.savingHours = false))).subscribe({
      next: () => {
        this.closeForm();
        this.loadBranches(this.pageData.page);
      }
    });
  }

  private loadBranchHoursSummary(branches: Branch[]): void {
    this.branchHoursByBranchId = {};
    branches.forEach((branch) => {
      this.branchService.getBranchHours(branch.id).subscribe({
        next: (hours) => {
          this.branchHoursByBranchId = {
            ...this.branchHoursByBranchId,
            [branch.id]: hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
          };
        }
      });
    });
  }

  private compactDayRange(days: number[]): string {
    const sortedDays = [...days].sort((a, b) => a - b);
    if (sortedDays.length === 7) {
      return 'Cả tuần';
    }
    if (sortedDays.join(',') === '1,2,3,4,5,6') {
      return 'T2 - T7';
    }
    if (sortedDays.join(',') === '6,7') {
      return 'Cuối tuần';
    }
    return sortedDays.map((day) => this.dayLabel(day).replace('Thứ ', 'T')).join(', ');
  }

  private buildRequest(): BranchCreateRequest {
    const value = this.branchForm.getRawValue();
    return {
      name: value.name.trim(),
      address: value.address.trim(),
      phone: value.phone.trim() || undefined,
      email: value.email.trim() || undefined,
      latitude: value.latitude,
      longitude: value.longitude,
      timezone: 'Asia/Ho_Chi_Minh',
      supportsPickup: value.supportsPickup,
      supportsDelivery: value.supportsDelivery,
      averagePreparationMinutes: value.averagePreparationMinutes
    };
  }
}
