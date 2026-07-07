import { Component, HostListener } from '@angular/core';

import { ConfirmDialogService, ConfirmDialogState, ConfirmDialogType } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  readonly dialog$ = this.confirmDialog.dialog$;
  inputValue = '';

  private activeDialogId: number | null = null;

  constructor(private readonly confirmDialog: ConfirmDialogService) {}

  onDialogChange(dialog: ConfirmDialogState | null): ConfirmDialogState | null {
    if (dialog?.id !== this.activeDialogId) {
      this.activeDialogId = dialog?.id ?? null;
      this.inputValue = dialog?.input?.value || '';
    }
    return dialog;
  }

  confirm(dialog: ConfirmDialogState): void {
    if (dialog.loading || this.isConfirmDisabled(dialog)) {
      return;
    }

    if (dialog.mode === 'prompt') {
      this.confirmDialog.close(this.inputValue.trim());
      return;
    }

    this.confirmDialog.close(true);
  }

  cancel(dialog: ConfirmDialogState): void {
    if (dialog.loading) {
      return;
    }

    this.confirmDialog.close(dialog.mode === 'prompt' ? null : false);
  }

  overlayClick(dialog: ConfirmDialogState): void {
    if (dialog.closeOnOverlay && !dialog.loading) {
      this.cancel(dialog);
    }
  }

  isConfirmDisabled(dialog: ConfirmDialogState): boolean {
    return dialog.mode === 'prompt' && !!dialog.input?.required && !this.inputValue.trim();
  }

  iconFor(type: ConfirmDialogType): string {
    const icons: Record<ConfirmDialogType, string> = {
      info: 'info',
      warning: 'warning',
      danger: 'report',
      success: 'check_circle'
    };
    return icons[type];
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    const dialog = this.confirmDialog.currentDialog;
    if (dialog && !dialog.loading) {
      this.cancel(dialog);
    }
  }
}
