import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { SelectOption } from '../../../../shared/models/select-option.model';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent {
  @Input() form!: FormGroup;
  @Input() categories: SelectOption[] = [];
  @Input() submitting = false;
  @Input() isEditMode = false;
  @Output() submitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() imageSelected = new EventEmitter<File>();

  previewImageUrl = '';

  get selectedCategoryLabel(): string {
    const categoryId = this.form?.get('categoryId')?.value;
    return this.categories.find((category) => category.value === categoryId)?.label || 'Chưa chọn danh mục';
  }

  submit(): void {
    this.submitted.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }

  selectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) { return; }

    this.previewImageUrl = URL.createObjectURL(file);
    this.imageSelected.emit(file);
  }

  get previewSource(): string {
    return this.previewImageUrl || this.form?.get('imageUrl')?.value || '';
  }
}
