import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastService } from '../../../../core/services/toast.service';
import { SelectOption } from '../../../../shared/models/select-option.model';
import { Product } from '../../models/product.model';
import { ProductCreateRequest, ProductUpdateRequest } from '../../models/product-request.model';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../../categories/services/category.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  categoryOptions: SelectOption[] = [];

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
    price: [0, [Validators.required, Validators.min(1)]],
    imageUrl: [''],
    categoryId: ['', [Validators.required]],
    preparationMinutes: [10, [Validators.min(0)]],
    availableIceLevels: ['0,30,50,70,100'],
    availableSugarLevels: ['0,30,50,70,100'],
    featured: [false],
    bestSeller: [false],
    status: ['ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK']
  });

  submitting = false;
  isEditMode = false;
  private productId = '';
  private selectedImageFile: File | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    const productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!productId;
    if (!productId) { return; }

    this.productId = productId;
    this.productService.getProductById(productId).subscribe({
      next: (product) => this.patchProduct(product)
    });
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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const request = this.buildRequest();

    if (this.isEditMode) {
      this.productService.updateProduct(this.productId, request as ProductUpdateRequest, this.selectedImageFile ?? undefined).subscribe({
        next: () => {
          this.toastService.success('Cập nhật sản phẩm thành công.');
          this.router.navigate(['/admin/products']);
        },
        error: () => { this.submitting = false; },
        complete: () => { this.submitting = false; }
      });
      return;
    }

    this.productService.createProduct(request as ProductCreateRequest, this.selectedImageFile ?? undefined).subscribe({
      next: () => {
        this.toastService.success('Tạo sản phẩm thành công.');
        this.router.navigate(['/admin/products']);
      },
      error: () => { this.submitting = false; },
      complete: () => { this.submitting = false; }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/products']);
  }

  onImageSelected(file: File): void {
    this.selectedImageFile = file;
  }

  private patchProduct(product: Product): void {
    this.form.patchValue({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      imageUrl: product.imageUrl ?? '',
      categoryId: product.categoryId,
      preparationMinutes: product.preparationMinutes ?? 10,
      availableIceLevels: product.availableIceLevels ?? '0,30,50,70,100',
      availableSugarLevels: product.availableSugarLevels ?? '0,30,50,70,100',
      featured: product.featured ?? false,
      bestSeller: product.bestSeller ?? false,
      status: product.status
    });
  }

  private buildRequest(): ProductCreateRequest | ProductUpdateRequest {
    const rawValue = this.form.getRawValue();

    return {
      name: rawValue.name,
      description: rawValue.description,
      price: rawValue.price,
      imageUrl: rawValue.imageUrl,
      categoryId: rawValue.categoryId,
      preparationMinutes: rawValue.preparationMinutes,
      availableIceLevels: rawValue.availableIceLevels,
      availableSugarLevels: rawValue.availableSugarLevels,
      featured: rawValue.featured,
      bestSeller: rawValue.bestSeller
    };
  }
}
