import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { Product } from '../../models/product.model';
import { ProductVariant } from '../../models/product-variant.model';
import { ProductService } from '../../services/product.service';
import { ProductVariantService } from '../../services/product-variant.service';

@Component({
  selector: 'app-product-variants-page',
  templateUrl: './product-variants-page.component.html',
  styleUrls: ['./product-variants-page.component.scss']
})
export class ProductVariantsPageComponent implements OnInit {
  pageSize = 12;
  readonly pageSizeOptions = [6, 12, 24, 48];
  readonly defaultSizeSet = [
    { label: 'M', priceDelta: 0 },
    { label: 'L', priceDelta: 5000 },
    { label: 'XL', priceDelta: 10000 }
  ];

  readonly form = this.formBuilder.nonNullable.group({
    variantName: ['', [Validators.required, Validators.maxLength(100)]],
    sizeLabel: ['', [Validators.maxLength(30)]],
    priceDelta: [0, [Validators.min(0)]],
    displayOrder: [0, [Validators.min(0)]]
  });

  products: Product[] = [];
  selectedProductId = '';
  variants: ProductVariant[] = [];
  pageData: PageResponse<ProductVariant> = this.createEmptyPage();
  selectedVariant: ProductVariant | null = null;
  loading = false;
  saving = false;
  productLoading = false;
  drawerOpen = false;
  errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productService: ProductService,
    private readonly variantService: ProductVariantService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  get selectedProduct(): Product | undefined {
    return this.products.find((product) => product.id === this.selectedProductId);
  }

  get activeCount(): number {
    return this.variants.filter((variant) => variant.status === 'ACTIVE').length;
  }

  get inactiveCount(): number {
    return this.variants.filter((variant) => variant.status === 'INACTIVE').length;
  }

  get nextDisplayOrder(): number {
    const maxOrder = this.variants.reduce((max, variant) => Math.max(max, variant.displayOrder || 0), 0);
    return maxOrder + 1;
  }

  onProductChange(productId: string): void {
    this.selectedProductId = productId;
    this.closeDrawer();
    this.loadVariants(0);
  }

  openCreateDrawer(): void {
    if (!this.selectedProductId) {
      this.errorMessage = 'Vui lòng chọn sản phẩm trước khi tạo biến thể.';
      return;
    }

    this.selectedVariant = null;
    this.form.reset({ variantName: '', sizeLabel: '', priceDelta: 0, displayOrder: this.nextDisplayOrder });
    this.drawerOpen = true;
  }

  openEditDrawer(variant: ProductVariant): void {
    this.selectedVariant = variant;
    this.form.reset({
      variantName: variant.variantName,
      sizeLabel: variant.sizeLabel || '',
      priceDelta: variant.priceDelta || 0,
      displayOrder: variant.displayOrder || 0
    });
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    if (this.saving) { return; }
    this.drawerOpen = false;
    this.selectedVariant = null;
  }

  saveVariant(): void {
    if (!this.selectedProductId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    this.saving = true;
    this.errorMessage = '';

    const request$ = this.selectedVariant
      ? this.variantService.updateVariant(this.selectedProductId, this.selectedVariant.id, payload)
      : this.variantService.createVariant(this.selectedProductId, payload);

    request$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.drawerOpen = false;
          this.loadVariants(this.pageData.page);
        },
        error: () => {
          this.errorMessage = 'Không lưu được biến thể. Vui lòng kiểm tra dữ liệu hoặc quyền thao tác.';
        }
      });
  }

  createDefaultSizeSet(): void {
    if (!this.selectedProductId) {
      this.errorMessage = 'Vui lòng chọn sản phẩm trước khi tạo bộ size.';
      return;
    }

    const existingSizes = new Set(this.variants.map((variant) => (variant.sizeLabel || '').trim().toUpperCase()));
    const sizesToCreate = this.defaultSizeSet.filter((size) => !existingSizes.has(size.label));

    if (!sizesToCreate.length) {
      this.errorMessage = 'Sản phẩm này đã có đủ size M, L và XL.';
      return;
    }

    const baseOrder = this.nextDisplayOrder;
    this.saving = true;
    this.errorMessage = '';

    forkJoin(sizesToCreate.map((size, index) => this.variantService.createVariant(this.selectedProductId, {
      variantName: `Size ${size.label}`,
      sizeLabel: size.label,
      priceDelta: size.priceDelta,
      displayOrder: baseOrder + index
    })))
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => this.loadVariants(0),
        error: () => {
          this.errorMessage = 'Không tạo được bộ size M/L/XL. Vui lòng thử lại.';
        }
      });
  }

  toggleStatus(variant: ProductVariant): void {
    if (!this.selectedProductId) { return; }

    const nextStatus = variant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.loading = true;
    this.errorMessage = '';

    this.variantService.updateVariantStatus(this.selectedProductId, variant.id, { status: nextStatus })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.loadVariants(this.pageData.page),
        error: () => {
          this.errorMessage = 'Không đổi được trạng thái biến thể. Vui lòng thử lại.';
        }
      });
  }

  deleteVariant(variant: ProductVariant): void {
    if (!this.selectedProductId || !window.confirm(`Xóa biến thể ${variant.variantName}? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.variantService.deleteVariant(this.selectedProductId, variant.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.loadVariants(this.pageData.page),
        error: () => {
          this.errorMessage = 'Không xóa được biến thể. Vui lòng thử lại.';
        }
      });
  }

  refresh(): void {
    if (this.selectedProductId) {
      this.loadVariants(this.pageData.page);
    } else {
      this.loadProducts();
    }
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.pageData.totalPages || page === this.pageData.page || this.loading) {
      return;
    }

    this.loadVariants(page);
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 12;
    this.loadVariants(0);
  }

  trackVariant(_: number, variant: ProductVariant): string {
    return variant.id;
  }

  trackProduct(_: number, product: Product): string {
    return product.id;
  }

  formatCurrency(value?: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
  }

  private loadProducts(): void {
    this.productLoading = true;
    this.errorMessage = '';

    this.productService.getProducts(0, 100)
      .pipe(finalize(() => (this.productLoading = false)))
      .subscribe({
        next: (pageResponse) => {
          this.products = pageResponse.content || [];
          this.selectedProductId = this.selectedProductId || this.products[0]?.id || '';
          if (this.selectedProductId) {
            this.loadVariants(0);
          }
        },
        error: () => {
          this.products = [];
          this.errorMessage = 'Không tải được danh sách sản phẩm.';
        }
      });
  }

  private loadVariants(page = 0): void {
    if (!this.selectedProductId) {
      this.pageData = this.createEmptyPage(page);
      this.variants = [];
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.variantService.getVariants(this.selectedProductId, page, this.pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pageResponse) => {
          this.pageData = this.normalizePage(pageResponse, page);
          this.variants = this.pageData.content;
        },
        error: () => {
          this.pageData = this.createEmptyPage(page);
          this.variants = [];
          this.errorMessage = 'Không tải được biến thể sản phẩm từ server.';
        }
      });
  }

  private normalizePage(pageResponse: PageResponse<ProductVariant> | null | undefined, page: number): PageResponse<ProductVariant> {
    if (!pageResponse) { return this.createEmptyPage(page); }

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

  private createEmptyPage(page = 0): PageResponse<ProductVariant> {
    return {
      content: [],
      page,
      size: this.pageSize,
      totalElements: 0,
      totalPages: 0,
      first: page === 0,
      last: true
    };
  }
}
