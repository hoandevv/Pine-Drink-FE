import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastService } from '../../../../core/services/toast.service';
import { SelectOption } from '../../../../shared/models/select-option.model';
import { ProductCreateRequest, ProductUpdateRequest } from '../../models/product-request.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  readonly categoryOptions: SelectOption[] = [
    { label: 'Coffee', value: 'coffee' },
    { label: 'Tea', value: 'tea' },
    { label: 'Freeze', value: 'freeze' },
    { label: 'Juice', value: 'juice' }
  ];

  readonly form = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: [''],
    price: [0, [Validators.required, Validators.min(1)]],
    imageUrl: [''],
    categoryId: ['', [Validators.required]],
    status: ['ACTIVE' as 'ACTIVE' | 'INACTIVE']
  });

  submitting = false;
  isEditMode = false;
  private productId = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!productId;
    if (!productId) { return; }

    this.productId = productId;
    this.productService.getProductById(productId).subscribe({
      next: (product) => {
        this.form.patchValue({
          code: product.code,
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          imageUrl: product.imageUrl ?? '',
          categoryId: product.categoryId,
          status: product.status
        });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const rawValue = this.form.getRawValue();

    if (this.isEditMode) {
      const request: ProductUpdateRequest = {
        name: rawValue.name,
        description: rawValue.description,
        price: rawValue.price,
        imageUrl: rawValue.imageUrl,
        categoryId: rawValue.categoryId,
        status: rawValue.status
      };

      this.productService.updateProduct(this.productId, request).subscribe({
        next: () => {
          this.toastService.success('Cap nhat product thanh cong.');
          this.router.navigate(['/products']);
        },
        error: () => { this.submitting = false; },
        complete: () => { this.submitting = false; }
      });
      return;
    }

    const request: ProductCreateRequest = {
      code: rawValue.code,
      name: rawValue.name,
      description: rawValue.description,
      price: rawValue.price,
      imageUrl: rawValue.imageUrl,
      categoryId: rawValue.categoryId
    };

    this.productService.createProduct(request).subscribe({
      next: () => {
        this.toastService.success('Tao product thanh cong.');
        this.router.navigate(['/products']);
      },
      error: () => { this.submitting = false; },
      complete: () => { this.submitting = false; }
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}
