import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { SelectOption } from '../../../../shared/models/select-option.model';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../../categories/services/category.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  pageSize = 12;
  readonly pageSizeOptions = [6, 12, 24, 48];

  readonly filterForm = this.formBuilder.nonNullable.group({
    keyword: [''],
    categoryId: [''],
    status: ['']
  });

  categoryOptions: SelectOption[] = [];

  readonly statusOptions: SelectOption[] = [
    { label: 'Đang bán', value: 'ACTIVE' },
    { label: 'Tạm ẩn', value: 'INACTIVE' }
  ];

  products: Product[] = [];
  loading = false;
  errorMessage = '';
  pageData: PageResponse<Product> = this.createEmptyPage();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  get activeProducts(): number {
    return this.products.filter((product) => product.status === 'ACTIVE').length;
  }

  get hiddenProducts(): number {
    return this.products.filter((product) => product.status === 'INACTIVE').length;
  }

  get averagePrice(): number {
    if (!this.products.length) {
      return 0;
    }

    const total = this.products.reduce((sum, product) => sum + (Number(product.price) || 0), 0);
    return Math.round(total / this.products.length);
  }

  search(): void {
    this.loadProducts(0);
  }

  reset(): void {
    this.filterForm.reset({ keyword: '', categoryId: '', status: '' });
    this.loadProducts(0);
  }

  createProduct(): void {
    this.router.navigate(['/admin/products/create']);
  }

  editProduct(id: string): void {
    this.router.navigate(['/admin/products', id]);
  }

  deleteProduct(product: Product): void {
    const productName = product.name || product.code || 'sản phẩm này';
    if (!window.confirm(`Xóa ${productName}? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.productService.deleteProduct(product.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.loadProducts(this.pageData.page),
        error: () => {
          this.errorMessage = 'Không thể xóa sản phẩm. Vui lòng thử lại hoặc kiểm tra quyền thao tác.';
        }
      });
  }

  onPageChange(page: number): void {
    this.loadProducts(page);
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.pageData.totalPages || page === this.pageData.page || this.loading) {
      return;
    }

    this.loadProducts(page);
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 12;
    this.loadProducts(0);
  }

  trackProduct(_: number, product: Product): string {
    return product.id;
  }

  private loadProducts(page = 0): void {
    const filters = this.filterForm.getRawValue();
    const keyword = filters.keyword.trim();

    this.loading = true;
    this.errorMessage = '';

    this.productService.getProducts(page, this.pageSize, keyword, filters.categoryId, filters.status)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pageResponse) => {
          const normalizedPage = this.normalizePage(pageResponse, page);
          this.products = normalizedPage.content;
          this.pageData = normalizedPage;
        },
        error: () => {
          this.products = [];
          this.pageData = this.createEmptyPage(page);
          this.errorMessage = 'Không tải được danh sách sản phẩm từ server. Vui lòng kiểm tra backend hoặc thử lại.';
        }
      });
  }

  private normalizePage(pageResponse: PageResponse<Product> | null | undefined, page: number): PageResponse<Product> {
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

  private createEmptyPage(page = 0): PageResponse<Product> {
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

  private loadCategories(): void {
    this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        this.categoryOptions = categories.map(c => ({
          label: c.name,
          value: c.id
        }));
      }
    });
  }
}
