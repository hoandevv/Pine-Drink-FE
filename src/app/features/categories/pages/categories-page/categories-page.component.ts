import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { PageResponse } from '../../../../shared/models/page-response.model';
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
    private readonly categoryService: CategoryService
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
    this.selectedCategory = category;
    this.selectedImageFile = null;
    this.previewImageUrl = '';
    this.form.reset({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      displayOrder: category.displayOrder || 0
    });
    this.drawerOpen = true;
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
    this.loading = true;
    this.errorMessage = '';

    this.categoryService.updateCategoryStatus(category.id, { status: nextStatus })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.loadCategories(this.pageData.page),
        error: () => {
          this.errorMessage = 'Không đổi được trạng thái danh mục. Vui lòng thử lại.';
        }
      });
  }

  deleteCategory(category: Category): void {
    if (!window.confirm(`Xóa danh mục ${category.name}? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.categoryService.deleteCategory(category.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.loadCategories(this.pageData.page),
        error: () => {
          this.errorMessage = 'Không xóa được danh mục. Có thể danh mục đang được sản phẩm sử dụng.';
        }
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
