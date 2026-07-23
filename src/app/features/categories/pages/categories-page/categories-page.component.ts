import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ToastNotificationService } from '../../../../core/services/toast.service';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss']
})
export class CategoriesPageComponent implements OnInit {
  pageSize = 12;
  readonly pageSizeOptions = [6, 12, 24, 48];

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(255)]],
    imageUrl: ['', [Validators.maxLength(1000)]],
    displayOrder: [0, [Validators.min(0)]]
  });

  categories: Category[] = [];
  pageData: PageResponse<Category> = this.createEmptyPage();
  selectedCategory: Category | null = null;
  loading = false;
  loadingDetail = false;
  saving = false;
  errorMessage = '';
  drawerOpen = false;
  imageBrokenIds = new Set<string>();
  searchTerm = '';
  statusFilter: 'ALL' | Category['status'] = 'ALL';

  selectedImageFile: File | null = null;
  previewImageUrl = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly categoryService: CategoryService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly toast: ToastNotificationService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  get activeCount(): number {
    return this.categories.filter((category) => category.status === 'ACTIVE').length;
  }

  get inactiveCount(): number {
    return this.categories.filter((category) => category.status === 'INACTIVE').length;
  }

  get nextDisplayOrder(): number {
    const maxOrder = this.categories.reduce((max, category) => Math.max(max, category.displayOrder || 0), 0);
    return maxOrder + 1;
  }

  get previewSource(): string {
    return this.previewImageUrl || this.form.get('imageUrl')?.value || '';
  }

  get filteredCategories(): Category[] {
    const keyword = this.searchTerm.trim().toLowerCase();

    return this.categories.filter((category) => {
      const matchesStatus = this.statusFilter === 'ALL' || category.status === this.statusFilter;
      const haystack = [category.name, category.code, category.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesKeyword = !keyword || haystack.includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }

  openCreateDrawer(): void {
    this.selectedCategory = null;
    this.selectedImageFile = null;
    this.previewImageUrl = '';
    this.form.reset({ name: '', description: '', imageUrl: '', displayOrder: this.nextDisplayOrder });
    this.drawerOpen = true;
  }

  openEditDrawer(category: Category): void {
    this.loadingDetail = true;
    this.errorMessage = '';
    this.categoryService.getCategoryById(category.id)
      .pipe(finalize(() => (this.loadingDetail = false)))
      .subscribe({
        next: (detail) => {
          this.selectedCategory = detail;
          this.selectedImageFile = null;
          this.previewImageUrl = '';
          this.form.reset({
            name: detail.name,
            description: detail.description || '',
            imageUrl: detail.imageUrl || '',
            displayOrder: detail.displayOrder || 0
          });
          this.drawerOpen = true;
        },
        error: () => {
          this.errorMessage = 'Không tải được chi tiết danh mục. Vui lòng thử lại.';
        }
      });
  }

  closeDrawer(): void {
    if (this.saving) {
      return;
    }
    this.drawerOpen = false;
    this.selectedCategory = null;
  }

  saveCategory(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    const payload = this.form.getRawValue();
    this.saving = true;
    this.errorMessage = '';

    const request$ = this.selectedCategory
      ? this.categoryService.updateCategory(this.selectedCategory.id, payload, this.selectedImageFile || undefined)
      : this.categoryService.createCategory(payload, this.selectedImageFile || undefined);

    request$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.drawerOpen = false;
          this.loadCategories(this.pageData.page);
        },
        error: () => {
          this.errorMessage = 'Không lưu được danh mục. Vui lòng kiểm tra dữ liệu hoặc quyền thao tác.';
        }
      });
  }

  toggleStatus(category: Category): void {
    const nextStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const isHiding = nextStatus === 'INACTIVE';

    this.confirmDialog.confirm({
      title: isHiding ? 'Xác nhận ẩn danh mục?' : 'Xác nhận hiện danh mục?',
      message: `${isHiding ? 'Ẩn' : 'Hiện'} danh mục ${category.name}?`,
      description: isHiding
        ? 'Danh mục bị ẩn sẽ không hiển thị ở khu vực khách hàng.'
        : 'Danh mục sẽ được hiển thị lại ở khu vực khách hàng.',
      confirmText: isHiding ? 'Ẩn danh mục' : 'Hiện danh mục',
      cancelText: 'Hủy',
      type: isHiding ? 'warning' : 'info'
    }).subscribe((confirmed) => {
      if (!confirmed) return;

      this.loading = true;
      this.errorMessage = '';

      this.categoryService.updateCategoryStatus(category.id, { status: nextStatus })
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => {
            const actionText = nextStatus === 'ACTIVE' ? 'hiện' : 'ẩn';
            this.toast.success(`Đã ${actionText} danh mục ${category.name}.`);
            this.loadCategories(this.pageData.page);
          },
          error: () => {
            this.errorMessage = 'Không đổi được trạng thái danh mục. Vui lòng thử lại.';
            this.toast.error('Không đổi được trạng thái danh mục. Vui lòng thử lại.');
          }
        });
    });
  }

  refresh(): void {
    this.loadCategories(this.pageData.page);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) { return; }

    this.selectedImageFile = file;
    this.previewImageUrl = URL.createObjectURL(file);
  }

  onPageChange(page: number): void {
    this.loadCategories(page);
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.pageData.totalPages || page === this.pageData.page || this.loading) {
      return;
    }

    this.loadCategories(page);
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 12;
    this.loadCategories(0);
  }

  markImageBroken(categoryId: string): void {
    this.imageBrokenIds.add(categoryId);
  }

  trackCategory(_: number, category: Category): string {
    return category.id;
  }

  private loadCategories(page = 0): void {
    this.loading = true;
    this.errorMessage = '';

    this.categoryService.getCategories(page, this.pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pageResponse) => {
          this.pageData = this.normalizePage(pageResponse, page);
          this.categories = this.pageData.content;
        },
        error: () => {
          this.pageData = this.createEmptyPage(page);
          this.categories = [];
          this.errorMessage = 'Không tải được danh mục từ server. Vui lòng kiểm tra backend hoặc quyền truy cập.';
        }
      });
  }

  private normalizePage(pageResponse: PageResponse<Category> | null | undefined, page: number): PageResponse<Category> {
    if (!pageResponse) {
      return this.createEmptyPage(page);
    }

    const content = Array.isArray(pageResponse.content) ? pageResponse.content : [];
    return {
      content,
      page: pageResponse.page ?? page,
      size: pageResponse.size ?? this.pageSize,
      totalElements: pageResponse.totalElements ?? content.length,
      totalPages: pageResponse.totalPages ?? (content.length ? 1 : 0),
      first: pageResponse.first ?? page === 0,
      last: pageResponse.last ?? true
    };
  }

  private createEmptyPage(page = 0): PageResponse<Category> {
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
