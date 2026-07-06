import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ConfirmDialogOptions, ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';

export interface PromptDialogOptions extends Omit<ConfirmDialogOptions, 'input'> {
  label?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PromptDialogService {
  constructor(private readonly confirmDialog: ConfirmDialogService) {}

  prompt(options: PromptDialogOptions): Observable<string | null> {
    return this.confirmDialog.prompt({
      ...options,
      input: {
        label: options.label,
        placeholder: options.placeholder,
        value: options.value,
        required: options.required
      }
    });
  }
}
