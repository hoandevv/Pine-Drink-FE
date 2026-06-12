import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, of, switchMap } from 'rxjs';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { SelectOption } from '../../../../shared/models/select-option.model';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../../categories/services/category.service';
import { BranchAvailabilityService } from '../../../branches/services/branch-availability.service';
import { BranchService } from '../../../branches/services/branch.service';
import { BranchProductAvailability, BranchProductAvailabilityRequest } from '../../../branches/models/branch-availability.model';
import { Branch } from '../../../branches/models/branch.model';

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
  branches: Branch[] = [];
  selectedBranchId = '';
  productAvailabilityMap = new Map<string, BranchProductAvailability>();
  availabilityLoading = false;
  updatingAvailabilityIds = new Set<string>();
  loading = false;
  errorMessage = '';
  pageData: PageResponse<Product> = this.createEmptyPage();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly branchService: BranchService,
    private readonly branchAvailabilityService: BranchAvailabilityService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadBranches();
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

  get selectedBranch(): Branch | undefined {
    return this.branches.find((branch) => branch.id === this.selectedBranchId);
  }

  get availableAtBranchCount(): number {
    return this.products.filter((product) => this.getAvailability(product.id)?.available).length;
  }

  get soldOutAtBranchCount(): number {
    return this.products.filter((product) => this.getAvailability(product.id) && !this.getAvailability(product.id)?.available).length;
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

  toggleProductStatus(product: Product): void {
    const nextStatus: Product['status'] = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = nextStatus === 'ACTIVE' ? 'bật lại' : 'ẩn';
    const productName = product.name || product.code || 'sản phẩm này';

    if (!window.confirm(`Xác nhận ${actionLabel} ${productName}?`)) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.productService.updateProductStatus(product.id, nextStatus)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.loadProducts(this.pageData.page),
        error: () => {
          this.errorMessage = `Không thể ${actionLabel} sản phẩm. Vui lòng thử lại hoặc kiểm tra quyền thao tác.`;
        }
      });
  }

  deleteProduct(product: Product): void {
    this.toggleProductStatus(product);
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

  onBranchChanged(branchId: string): void {
    this.selectedBranchId = branchId;
    this.refreshAvailability();
  }

  getAvailability(productId: string): BranchProductAvailability | undefined {
    return this.productAvailabilityMap.get(productId);
  }

  getBranchSalePrice(product: Product): number {
    const availability = this.getAvailability(product.id);
    return availability?.salePrice ?? product.price;
  }

  isSoldOutAtBranch(product: Product): boolean {
    const availability = this.getAvailability(product.id);
    return Boolean(availability && !availability.available);
  }

  isUpdatingAvailability(productId: string): boolean {
    return this.updatingAvailabilityIds.has(productId);
  }

  markProductAvailable(product: Product): void {
    this.saveProductAvailability(product, true);
  }

  markProductSoldOut(product: Product): void {
    const reason = window.prompt(`Lý do hết hàng cho ${product.name}?`, this.getAvailability(product.id)?.soldOutReason || 'Hết nguyên liệu');
    if (reason === null) {
      return;
    }

    this.saveProductAvailability(product, false, reason.trim() || 'Hết nguyên liệu');
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
          this.refreshAvailability();
        },
        error: () => {
          this.products = [];
          this.productAvailabilityMap.clear();
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

  private loadBranches(): void {
    this.branchService.getActiveBranches(0, 100)
      .pipe(
        switchMap((pageResponse) => {
          this.branches = pageResponse.content || [];
          this.selectedBranchId = this.selectedBranchId || this.branches[0]?.id || '';
          return this.selectedBranchId ? this.branchAvailabilityService.getProductAvailabilities(this.selectedBranchId) : of([]);
        })
      )
      .subscribe({
        next: (items) => this.setAvailabilityMap(items),
        error: () => this.productAvailabilityMap.clear()
      });
  }

  private refreshAvailability(): void {
    if (!this.selectedBranchId) {
      this.productAvailabilityMap.clear();
      return;
    }

    this.availabilityLoading = true;
    this.branchAvailabilityService.getProductAvailabilities(this.selectedBranchId)
      .pipe(finalize(() => (this.availabilityLoading = false)))
      .subscribe({
        next: (items) => this.setAvailabilityMap(items),
        error: () => this.productAvailabilityMap.clear()
      });
  }

  private saveProductAvailability(product: Product, available: boolean, soldOutReason: string | null = null): void {
    if (!this.selectedBranchId || this.isUpdatingAvailability(product.id)) {
      return;
    }

    const current = this.getAvailability(product.id);
    const request: BranchProductAvailabilityRequest = {
      productId: product.id,
      available,
      salePrice: current?.salePrice ?? null,
      soldOutReason: available ? null : soldOutReason,
      availableFrom: current?.availableFrom ?? null,
      availableTo: current?.availableTo ?? null
    };

    this.updatingAvailabilityIds.add(product.id);
    const action$ = current?.id
      ? this.branchAvailabilityService.updateProductAvailability(this.selectedBranchId, current.id, request)
      : this.branchAvailabilityService.createProductAvailability(this.selectedBranchId, request);

    action$
      .pipe(finalize(() => this.updatingAvailabilityIds.delete(product.id)))
      .subscribe({
        next: (item) => {
          this.productAvailabilityMap.set(item.productId, item);
          this.productAvailabilityMap = new Map(this.productAvailabilityMap);
        },
        error: () => {
          this.errorMessage = 'Không cập nhật được trạng thái tồn kho chi nhánh. Vui lòng kiểm tra quyền PERM_BRANCH_UPDATE.';
        }
      });
  }

  private setAvailabilityMap(items: BranchProductAvailability[]): void {
    this.productAvailabilityMap = new Map(items.map((item) => [item.productId, item]));
  }
}
