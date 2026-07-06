import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export type ConfirmDialogType = 'info' | 'warning' | 'danger' | 'success';

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmDialogType;
  risks?: string[];
  affectedItems?: string[];
  closeOnOverlay?: boolean;
  input?: {
    label?: string;
    placeholder?: string;
    value?: string;
    required?: boolean;
  };
}

export interface ConfirmDialogState extends ConfirmDialogOptions {
  id: number;
  loading: boolean;
  mode: 'confirm' | 'alert' | 'prompt';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private sequence = 0;
  private result$?: Subject<boolean | string | null>;
  private readonly dialogSubject = new BehaviorSubject<ConfirmDialogState | null>(null);

  readonly dialog$ = this.dialogSubject.asObservable();

  get currentDialog(): ConfirmDialogState | null {
    return this.dialogSubject.value;
  }

  confirm(options: ConfirmDialogOptions): Observable<boolean> {
    return this.open<boolean>({ ...options, mode: 'confirm' });
  }

  alert(options: Omit<ConfirmDialogOptions, 'cancelText'>): Observable<boolean> {
    return this.open<boolean>({
      ...options,
      mode: 'alert',
      cancelText: '',
      confirmText: options.confirmText || 'Đã hiểu'
    });
  }

  prompt(options: ConfirmDialogOptions): Observable<string | null> {
    return this.open<string | null>({ ...options, mode: 'prompt' });
  }

  setLoading(loading: boolean): void {
    const current = this.dialogSubject.value;
    if (current) {
      this.dialogSubject.next({ ...current, loading });
    }
  }

  close(value: boolean | string | null): void {
    this.result$?.next(value);
    this.result$?.complete();
    this.result$ = undefined;
    this.dialogSubject.next(null);
  }

  private open<T>(options: ConfirmDialogOptions & { mode: ConfirmDialogState['mode'] }): Observable<T> {
    this.result$?.complete();
    this.result$ = new Subject<boolean | string | null>();
    this.dialogSubject.next({
      id: ++this.sequence,
      type: options.type || 'warning',
      confirmText: options.confirmText || 'Xác nhận',
      cancelText: options.cancelText ?? 'Hủy',
      closeOnOverlay: options.closeOnOverlay ?? true,
      loading: false,
      ...options
    });

    return this.result$.asObservable() as Observable<T>;
  }
}
