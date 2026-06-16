import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { Topping } from '../../../toppings/models/topping.model';
import { ToppingService } from '../../../toppings/services/topping.service';
import { Product } from '../../models/product.model';
import { ProductTopping } from '../../models/product-topping.model';
import { ProductService } from '../../services/product.service';
import { ProductToppingService } from '../../services/product-topping.service';

@Component({
  selector: 'app-product-toppings-page',
  templateUrl: './product-toppings-page.component.html',
  styleUrls: ['./product-toppings-page.component.scss']
})
export class ProductToppingsPageComponent implements OnInit {
  pageSize = 12;
  readonly pageSizeOptions = [6, 12, 24, 48];

  readonly form = this.formBuilder.nonNullable.group({
    toppingId: ['', Validators.required],
    isDefault: [false],
    maxQuantity: [1, [Validators.required, Validators.min(1), Validators.max(20)]]
  });

  products: Product[] = [];
  toppings: Topping[] = [];
  selectedProductId = '';
  productToppings: ProductTopping[] = [];
  pageData: PageResponse<ProductTopping> = this.createEmptyPage();
  selectedProductTopping: ProductTopping | null = null;
  loading = false;
  saving = false;
  productLoading = false;
  toppingLoading = false;
  drawerOpen = false;
  errorMessage = '';
  searchTerm = '';
  productSearchTerm = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productService: ProductService,
    private readonly toppingService: ToppingService,
    private readonly productToppingService: ProductToppingService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  get selectedProduct(): Product | undefined {
    return this.products.find((product) => product.id === this.selectedProductId);
  }

  get filteredProducts(): Product[] {
    const keyword = this.productSearchTerm.trim().toLowerCase();
    if (!keyword) { return this.products; }

    return this.products.filter((product) => [product.name, product.code, product.categoryName]
      .some((value) => (value || '').toLowerCase().includes(keyword)));
  }

  get assignedToppingIds(): Set<string> {
    return new Set(this.productToppings.map((item) => item.toppingId));
  }

  get availableToppings(): Topping[] {
    const assignedIds = this.assignedToppingIds;
    return this.toppings.filter((topping) => !assignedIds.has(topping.id) || topping.id === this.selectedProductTopping?.toppingId);
  }

  get visibleProductToppings(): ProductTopping[] {
    const keyword = this.searchTerm.trim().toLowerCase();
    return this.productToppings.filter((item) => {
      const matchStatus = this.statusFilter === 'ALL' || item.status === this.statusFilter;
      const matchSearch = !keyword || [item.toppingName, item.toppingCode, item.toppingGroupName]
        .some((value) => (value || '').toLowerCase().includes(keyword));
      return matchStatus && matchSearch;
    });
  }

  get activeCount(): number {
    return this.productToppings.filter((item) => item.status === 'ACTIVE').length;
  }

  get defaultCount(): number {
    return this.productToppings.filter((item) => item.isDefault).length;
  }

  onProductChange(productId: string): void {
    this.selectedProductId = productId;
    this.closeDrawer();
    this.loadProductToppings(0);
  }

  openCreateDrawer(): void {
    if (!this.selectedProductId) {
      this.errorMessage = 'Vui lòng chọn sản phẩm trước khi gắn topping.';
      return;
    }

    this.selectedProductTopping = null;
    this.form.reset({ toppingId: this.availableToppings[0]?.id || '', isDefault: false, maxQuantity: 1 });
    this.form.controls.toppingId.enable();
    this.drawerOpen = true;
  }

  openEditDrawer(item: ProductTopping): void {
    this.selectedProductTopping = item;
    this.form.reset({ toppingId: item.toppingId, isDefault: item.isDefault, maxQuantity: item.maxQuantity || 1 });
    this.form.controls.toppingId.disable();
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    if (this.saving) { return; }
    this.drawerOpen = false;
    this.selectedProductTopping = null;
    this.form.controls.toppingId.enable();
  }

  saveProductTopping(): void {
    if (!this.selectedProductId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    const request$ = this.selectedProductTopping
      ? this.productToppingService.updateProductTopping(this.selectedProductId, this.selectedProductTopping.id, {
        isDefault: payload.isDefault,
        maxQuantity: payload.maxQuantity
      })
      : this.productToppingService.assignProductTopping(this.selectedProductId, payload);

    this.saving = true;
    this.errorMessage = '';

    request$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.drawerOpen = false;
          this.loadProductToppings(this.pageData.page);
        },
        error: () => {
          this.errorMessage = 'Không lưu được topping cho sản phẩm. Vui lòng kiểm tra dữ liệu hoặc quyền thao tác.';
        }
      });
  }

  toggleStatus(item: ProductTopping): void {
    if (!this.selectedProductId) { return; }
    const status = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.loading = true;
    this.errorMessage = '';

    this.productToppingService.updateProductToppingStatus(this.selectedProductId, item.id, { status })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.loadProductToppings(this.pageData.page),
        error: () => {
          this.errorMessage = 'Không đổi được trạng thái topping của sản phẩm.';
        }
      });
  }

  deleteProductTopping(item: ProductTopping): void {
    if (!this.selectedProductId || !window.confirm(`Gỡ topping ${item.toppingName} khỏi sản phẩm?`)) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.productToppingService.deleteProductTopping(this.selectedProductId, item.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.loadProductToppings(this.pageData.page),
        error: () => {
          this.errorMessage = 'Không gỡ được topping khỏi sản phẩm.';
        }
      });
  }

  refresh(): void {
    this.selectedProductId ? this.loadProductToppings(this.pageData.page) : this.loadInitialData();
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.pageData.totalPages || page === this.pageData.page || this.loading) { return; }
    this.loadProductToppings(page);
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 12;
    this.loadProductToppings(0);
  }

  trackProduct(_: number, product: Product): string { return product.id; }
  trackTopping(_: number, topping: Topping): string { return topping.id; }
  trackProductTopping(_: number, item: ProductTopping): string { return item.id; }

  formatCurrency(value?: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
  }

  private loadInitialData(): void {
    this.loadProducts();
    this.loadToppings();
  }

  private loadProducts(): void {
    this.productLoading = true;
    this.productService.getProducts(0, 100)
      .pipe(finalize(() => (this.productLoading = false)))
      .subscribe({
        next: (pageResponse) => {
          this.products = pageResponse.content || [];
          this.selectedProductId = this.selectedProductId || this.products[0]?.id || '';
          if (this.selectedProductId) { this.loadProductToppings(0); }
        },
        error: () => {
          this.products = [];
          this.errorMessage = 'Không tải được danh sách sản phẩm.';
        }
      });
  }

  private loadToppings(): void {
    this.toppingLoading = true;
    this.toppingService.getActiveToppings()
      .pipe(finalize(() => (this.toppingLoading = false)))
      .subscribe({
        next: (toppings) => (this.toppings = toppings),
        error: () => {
          this.toppings = [];
          this.errorMessage = 'Không tải được kho topping active.';
        }
      });
  }

  private loadProductToppings(page = 0): void {
    if (!this.selectedProductId) {
      this.pageData = this.createEmptyPage(page);
      this.productToppings = [];
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.productToppingService.getProductToppings(this.selectedProductId, page, this.pageSize)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pageResponse) => {
          this.pageData = pageResponse;
          this.productToppings = pageResponse.content || [];
        },
        error: () => {
          this.pageData = this.createEmptyPage(page);
          this.productToppings = [];
          this.errorMessage = 'Không tải được topping đã gắn cho sản phẩm.';
        }
      });
  }

  private createEmptyPage(page = 0): PageResponse<ProductTopping> {
    return { content: [], page, size: this.pageSize, totalElements: 0, totalPages: 0, first: page === 0, last: true };
  }
}
