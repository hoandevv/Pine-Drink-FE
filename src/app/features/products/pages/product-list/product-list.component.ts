import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { ToastService } from '../../../../core/services/toast.service';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { SelectOption } from '../../../../shared/models/select-option.model';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  readonly filterForm = this.formBuilder.nonNullable.group({
    keyword: [''],
    categoryId: [''],
    status: ['']
  });

  readonly categoryOptions: SelectOption[] = [
    { label: 'Coffee', value: 'coffee' },
    { label: 'Tea', value: 'tea' },
    { label: 'Freeze', value: 'freeze' },
    { label: 'Juice', value: 'juice' }
  ];

  readonly statusOptions: SelectOption[] = [
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'INACTIVE', value: 'INACTIVE' }
  ];

  products: Product[] = [];
  loading = false;
  pageData: PageResponse<Product> = {
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
    private readonly productService: ProductService,
    private readonly router: Router,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  search(): void {
    this.loadProducts(0);
  }

  reset(): void {
    this.filterForm.reset({ keyword: '', categoryId: '', status: '' });
    this.loadProducts(0);
  }

  createProduct(): void {
    this.router.navigate(['/products/create']);
  }

  editProduct(id: string): void {
    this.router.navigate(['/products', id]);
  }

  deleteProduct(id: string): void {
    if (!window.confirm('Ban co chac chan muon xoa product nay khong?')) {
      return;
    }

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.toastService.success('Xoa product thanh cong.');
        const fallbackPage = this.products.length === 1 && this.pageData.page > 0 ? this.pageData.page - 1 : this.pageData.page;
        this.loadProducts(fallbackPage);
      }
    });
  }

  onPageChange(page: number): void {
    this.loadProducts(page);
  }

  private loadProducts(page = this.pageData.page): void {
    const filters = this.filterForm.getRawValue();
    this.loading = true;
    this.productService.getProducts(page, this.pageData.size, filters.keyword, filters.categoryId, filters.status).subscribe({
      next: (response) => {
        this.products = response.content;
        this.pageData = response;
      },
      error: () => {
        this.products = [];
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
