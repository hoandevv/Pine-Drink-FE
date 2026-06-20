import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { Branch } from '../../../branches/models/branch.model';
import { BranchService } from '../../../branches/services/branch.service';
import { VoucherPayload, VoucherResponse, VoucherService } from '../../services/voucher.service';

@Component({
  selector: 'app-vouchers-page',
  templateUrl: './vouchers-page.component.html',
  styleUrls: ['./vouchers-page.component.scss']
})
export class VouchersPageComponent implements OnInit {
  vouchers: VoucherResponse[] = [];
  branches: Branch[] = [];
  loading = false;
  loadingBranches = false;
  branchScopeOpen = false;
  branchKeyword = '';
  saving = false;
  showForm = false;
  editing: VoucherResponse | null = null;

  keyword = '';
  status = '';
  discountType = '';
  page = 0;
  size = 12;
  readonly pageSizeOptions = [6, 12, 24, 48];
  totalPages = 0;
  totalElements = 0;

  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(255)]],
    discountType: ['PERCENTAGE', Validators.required],
    discountValue: [10, [Validators.required, Validators.min(0.01)]],
    maxDiscountAmount: [null as number | null],
    minOrderAmount: [0],
    usageLimit: [null as number | null],
    usageLimitPerCustomer: [1],
    startAt: ['', Validators.required],
    endAt: ['', Validators.required],
    branchIdsText: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly voucherService: VoucherService,
    private readonly branchService: BranchService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadVouchers();
    this.loadBranches();
  }

  loadVouchers(): void {
    this.loading = true;
    this.voucherService.search({
      keyword: this.keyword.trim(),
      status: this.status,
      discountType: this.discountType,
      page: this.page,
      size: this.size,
      sort: 'createdAt,desc'
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: res => {
        this.vouchers = res.data.content;
        this.totalPages = res.data.totalPages;
        this.totalElements = res.data.totalElements;
      },
      error: () => this.toast.error('Không tải được danh sách voucher')
    });
  }

  openCreate(): void {
    this.editing = null;
    this.showForm = true;
    this.form.reset({
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscountAmount: null,
      minOrderAmount: 0,
      usageLimit: null,
      usageLimitPerCustomer: 1,
      startAt: this.toDateTimeLocal(new Date()),
      endAt: this.toDateTimeLocal(new Date(Date.now() + 7 * 86400000)),
      branchIdsText: ''
    });
    this.branchKeyword = '';
    this.branchScopeOpen = false;
  }

  openEdit(voucher: VoucherResponse): void {
    this.editing = voucher;
    this.showForm = true;
    this.form.reset({
      code: voucher.code,
      name: voucher.name,
      description: voucher.description || '',
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscountAmount: voucher.maxDiscountAmount ?? null,
      minOrderAmount: voucher.minOrderAmount ?? 0,
      usageLimit: voucher.usageLimit ?? null,
      usageLimitPerCustomer: voucher.usageLimitPerCustomer ?? 1,
      startAt: this.toDateTimeLocal(voucher.startAt),
      endAt: this.toDateTimeLocal(voucher.endAt),
      branchIdsText: (voucher.branchIds || []).join(', ')
    });
    this.branchKeyword = '';
    this.branchScopeOpen = false;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.saving = true;
    const request$ = this.editing
      ? this.voucherService.update(this.editing.id, payload)
      : this.voucherService.create(payload);

    request$.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.toast.success(this.editing ? 'Đã cập nhật voucher' : 'Đã tạo voucher');
        this.showForm = false;
        this.loadVouchers();
      },
      error: err => this.toast.error(err?.error?.message || 'Lưu voucher thất bại')
    });
  }

  updateStatus(voucher: VoucherResponse, status: string): void {
    const action = status === 'ACTIVE' ? 'bật' : 'tắt';
    if (!confirm(`Bạn chắc muốn ${action} voucher ${voucher.code}?`)) return;

    this.voucherService.updateStatus(voucher.id, status).subscribe({
      next: () => {
        this.toast.success('Đã cập nhật trạng thái');
        this.loadVouchers();
      },
      error: () => this.toast.error('Cập nhật trạng thái thất bại')
    });
  }

  remove(voucher: VoucherResponse): void {
    if (!confirm(`Xóa voucher ${voucher.code}?`)) return;
    this.voucherService.delete(voucher.id).subscribe({
      next: () => {
        this.toast.success('Đã xóa voucher');
        this.loadVouchers();
      },
      error: () => this.toast.error('Xóa voucher thất bại')
    });
  }

  applyFilters(): void {
    this.page = 0;
    this.loadVouchers();
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.page || this.loading) return;
    this.page = page;
    this.loadVouchers();
  }

  changePageSize(size: number): void {
    this.size = Number(size) || 12;
    this.page = 0;
    this.loadVouchers();
  }

  usagePercent(voucher: VoucherResponse): number {
    if (!voucher.usageLimit) return 0;
    return Math.min(100, Math.round((voucher.usedCount / voucher.usageLimit) * 100));
  }

  formatDiscount(voucher: VoucherResponse): string {
    return voucher.discountType === 'PERCENTAGE'
      ? `${voucher.discountValue}%`
      : `${Number(voucher.discountValue).toLocaleString('vi-VN')}đ`;
  }

  isBranchSelected(branchId: string): boolean {
    return this.selectedBranchIds.includes(branchId);
  }

  toggleBranch(branchId: string): void {
    const selected = new Set(this.selectedBranchIds);
    selected.has(branchId) ? selected.delete(branchId) : selected.add(branchId);
    this.form.patchValue({ branchIdsText: Array.from(selected).join(', ') });
  }

  clearBranchScope(): void {
    this.form.patchValue({ branchIdsText: '' });
  }

  get filteredBranches(): Branch[] {
    const keyword = this.branchKeyword.trim().toLowerCase();
    if (!keyword) return this.branches;
    return this.branches.filter(branch =>
      [branch.name, branch.code, branch.address]
        .filter(Boolean)
        .some(value => value!.toLowerCase().includes(keyword))
    );
  }

  get selectedBranchLabels(): string[] {
    const selected = new Set(this.selectedBranchIds);
    return this.branches
      .filter(branch => selected.has(branch.id))
      .map(branch => branch.name);
  }

  get selectedBranchIds(): string[] {
    return (this.form.controls.branchIdsText.value || '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);
  }

  private loadBranches(): void {
    this.loadingBranches = true;
    this.branchService.getActiveBranches(0, 200)
      .pipe(finalize(() => (this.loadingBranches = false)))
      .subscribe({
        next: page => (this.branches = page.content || []),
        error: () => this.toast.error('Không tải được danh sách chi nhánh')
      });
  }

  private buildPayload(): VoucherPayload {
    const raw = this.form.getRawValue();
    return {
      code: raw.code!.trim().toUpperCase(),
      name: raw.name!.trim(),
      description: raw.description?.trim() || null,
      discountType: raw.discountType!,
      discountValue: Number(raw.discountValue),
      maxDiscountAmount: raw.maxDiscountAmount === null ? null : Number(raw.maxDiscountAmount),
      minOrderAmount: Number(raw.minOrderAmount || 0),
      usageLimit: raw.usageLimit === null ? null : Number(raw.usageLimit),
      usageLimitPerCustomer: raw.usageLimitPerCustomer === null ? null : Number(raw.usageLimitPerCustomer),
      startAt: this.toIsoLocal(raw.startAt!),
      endAt: this.toIsoLocal(raw.endAt!),
      branchIds: (raw.branchIdsText || '').split(',').map(id => id.trim()).filter(Boolean)
    };
  }

  private toDateTimeLocal(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private toIsoLocal(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
  }
}
