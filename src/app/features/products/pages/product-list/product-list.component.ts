import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { SelectOption } from '../../../../shared/models/select-option.model';
import { Product } from '../../models/product.model';

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
    private readonly router: Router
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
    this.router.navigate(['/admin/products/create']);
  }

  editProduct(id: string): void {
    this.router.navigate(['/admin/products', id]);
  }

  deleteProduct(id: string): void {
    if (!window.confirm('Bạn có chắc chắn muốn xóa product này khỏi mock UI không?')) {
      return;
    }

    this.products = this.products.filter((product) => product.id !== id);
    this.pageData = {
      ...this.pageData,
      content: this.products,
      totalElements: this.products.length,
      totalPages: this.products.length > 0 ? 1 : 0,
      first: true,
      last: true
    };
  }

  onPageChange(page: number): void {
    this.loadProducts(page);
  }

  private readonly mockProducts: Product[] = [
    {
      id: 'mock-1',
      code: 'PD-PINE-001',
      name: 'Pineapple Mint Tea',
      description: 'Trà dứa bạc hà mát lạnh, best seller mùa hè.',
      price: 49000,
      categoryId: 'fruit-tea',
      categoryName: 'Trà trái cây',
      status: 'ACTIVE'
    },
    {
      id: 'mock-2',
      code: 'PD-MILK-002',
      name: 'Brown Sugar Milk Tea',
      description: 'Sữa tươi đường nâu cùng trân châu mềm dẻo.',
      price: 59000,
      categoryId: 'milk-tea',
      categoryName: 'Milk Tea Signature',
      status: 'ACTIVE'
    },
    {
      id: 'mock-3',
      code: 'PD-SMOOTH-003',
      name: 'Tropical Pine Smoothie',
      description: 'Smoothie dứa nhiệt đới, kem cheese và topping trái cây.',
      price: 69000,
      categoryId: 'smoothie',
      categoryName: 'Smoothie Dứa',
      status: 'ACTIVE'
    },
    {
      id: 'mock-4',
      code: 'PD-LATTE-004',
      name: 'Matcha Pine Latte',
      description: 'Matcha latte mix syrup dứa signature Pine Drink.',
      price: 65000,
      categoryId: 'coffee',
      categoryName: 'Coffee & Latte',
      status: 'INACTIVE'
    }
  ];

  private loadProducts(page = 0): void {
    const filters = this.filterForm.getRawValue();
    const keyword = filters.keyword.trim().toLowerCase();

    const content = this.mockProducts.filter((product) => {
      const matchesKeyword = !keyword || product.name.toLowerCase().includes(keyword) || product.code.toLowerCase().includes(keyword);
      const matchesCategory = !filters.categoryId || product.categoryId === filters.categoryId;
      const matchesStatus = !filters.status || product.status === filters.status;

      return matchesKeyword && matchesCategory && matchesStatus;
    });

    this.products = content;
    this.pageData = {
      content,
      page,
      size: content.length || 10,
      totalElements: content.length,
      totalPages: content.length > 0 ? 1 : 0,
      first: true,
      last: true
    };
    this.loading = false;
  }
}
