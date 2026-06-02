import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { Topping } from '../../models/topping.model';
import { ToppingService } from '../../services/topping.service';

@Component({
  selector: 'app-toppings-page',
  templateUrl: './toppings-page.component.html',
  styleUrls: ['./toppings-page.component.scss']
})
export class ToppingsPageComponent implements OnInit {
  pageSize = 12;
  readonly pageSizeOptions = [6, 12, 24, 48];

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    price: [0, [Validators.required, Validators.min(0)]],
    imageUrl: ['', [Validators.maxLength(1000)]],
    groupName: ['', [Validators.maxLength(100)]]
  });

  toppings: Topping[] = [];
  pageData: PageResponse<Topping> = this.createEmptyPage();
  selectedTopping: Topping | null = null;
  loading = false;
  saving = false;
  drawerOpen = false;
  errorMessage = '';
  searchTerm = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  groupFilter = 'ALL';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly toppingService: ToppingService
  ) { }

  ngOnInit(): void {
    this.loadToppings();
  }

  get activeCount(): number {
    return this.toppings.filter((topping) => topping.status === 'ACTIVE').length;
  }

  get inactiveCount(): number {
    return this.toppings.filter((topping) => topping.status === 'INACTIVE').length;
  }

  get groupOptions(): string[] {
    return Array.from(new Set(this.toppings.map((topping) => topping.groupName || 'Khác'))).sort();
  }

  get visibleToppings(): Topping[] {
    const keyword = this.searchTerm.trim().toLowerCase();
    return this.toppings.filter((topping) => {
      const groupName = topping.groupName || 'Khác';
      const matchStatus = this.statusFilter === 'ALL' || topping.status === this.statusFilter;
      const matchGroup = this.groupFilter === 'ALL' || groupName === this.groupFilter;
      const matchSearch = !keyword || [topping.name, topping.code, groupName]
        .some((value) => (value || '').toLowerCase().includes(keyword));
      return matchStatus && matchGroup && matchSearch;
    });
  }

  openCreateDrawer(): void {
    this.selectedTopping = null;
    this.form.reset({ name: '', price: 0, imageUrl: '', groupName: '' });
    this.drawerOpen = true;
  }

  openEditDrawer(topping: Topping): void {
    this.selectedTopping = topping;
    this.form.reset({
      name: topping.name,
      price: topping.price || 0,
      imageUrl: topping.imageUrl || '',
      groupName: topping.groupName || ''
    });
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    if (this.saving) { return; }
    this.drawerOpen = false;
    this.selectedTopping = null;
  }

  saveTopping(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    const request$ = this.selectedTopping
      ? this.toppingService.updateTopping(this.selectedTopping.id, payload)
      : this.toppingService.createTopping(payload);

    this.saving = true;
    this.errorMessage = '';

    request$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.drawerOpen = false;
          this.loadToppings(this.pageData.page);
        },
        error: () => {
          this.errorMessage = 'Không lưu được topping. Vui lòng kiểm tra dữ liệu hoặc quyền thao tác.';
        }
      });
  }

  toggleStatus(topping: Topping): void {
    const nextStatus = topping.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.loading = true;
    this.errorMessage = '';

    this.toppingService.updateToppingStatus(topping.id, { status: nextStatus })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.loadToppings(this.pageData.page),
        error: () => {
          this.errorMessage = 'Không đổi được trạng thái topping. Vui lòng thử lại.';
        }
      });
  }

  deleteTopping(topping: Topping): void {
    if (!window.confirm(`Xóa topping ${topping.name}? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.toppingService.deleteTopping(topping.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.loadToppings(this.pageData.page),
        error: () => {
          this.errorMessage = 'Không xóa được topping. Có thể topping đang được gắn với sản phẩm.';
        }
      });
  }

  refresh(): void {
    this.loadToppings(this.pageData.page);
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.pageData.totalPages || page === this.pageData.page || this.loading) {
      return;
    }
    this.loadToppings(page);
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 12;
    this.loadToppings(0);
  }

  trackTopping(_: number, topping: Topping): string {
    return topping.id;
  }

  formatCurrency(value?: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
  }

  private loadToppings(page = 0): void {
    this.loading = true;
    this.errorMessage = '';

    this.toppingService.getToppings(page, this.pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pageResponse) => {
          this.pageData = pageResponse;
          this.toppings = pageResponse.content || [];
        },
        error: () => {
          this.pageData = this.createEmptyPage(page);
          this.toppings = [];
          this.errorMessage = 'Không tải được danh sách topping.';
        }
      });
  }

  private createEmptyPage(page = 0): PageResponse<Topping> {
    return {
      content: [],
      page,
      size: this.pageSize,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true
    };
  }
}
