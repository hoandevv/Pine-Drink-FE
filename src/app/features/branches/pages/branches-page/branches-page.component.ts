import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { BranchCreateRequest } from '../../models/branch-request.model';
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

  readonly statusOptions = ['ALL', 'ACTIVE', 'INACTIVE', 'MAINTENANCE'];

  branches: Branch[] = [];
  loading = false;
  saving = false;
  formOpen = false;
  editingBranch: Branch | null = null;
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
        next: () => {
          this.closeForm();
          this.loadBranches(this.pageData.page);
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
        }
      });
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
