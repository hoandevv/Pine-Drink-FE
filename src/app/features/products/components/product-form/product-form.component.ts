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

  submit(): void {
    this.submitted.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
