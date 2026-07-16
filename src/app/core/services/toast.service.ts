import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastNotificationService {
  private readonly toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  private sequence = 0;

  readonly toasts$ = this.toastsSubject.asObservable();

  show(message: string, type: ToastType = 'info', title?: string, duration = 3500): void {
    const toast: ToastMessage = {
      id: ++this.sequence,
      type,
      message,
      title
    };

    this.toastsSubject.next([toast]);
    window.setTimeout(() => this.dismiss(toast.id), duration);
  }

  success(message: string, title?: string): void {
    this.show(message, 'success', title);
  }

  error(message: string, title?: string): void {
    this.show(message, 'error', title);
  }

  warning(message: string, title?: string): void {
    this.show(message, 'warning', title);
  }

  info(message: string, title?: string): void {
    this.show(message, 'info', title);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private readonly notifications: ToastNotificationService) {}

  get toasts$() {
    return this.notifications.toasts$;
  }

  show(message: string, type: ToastType = 'info', title?: string, duration = 3500): void {
    this.notifications.show(message, type, title, duration);
  }

  success(message: string, title?: string): void {
    this.notifications.success(message, title);
  }

  error(message: string, title?: string): void {
    this.notifications.error(message, title);
  }

  warning(message: string, title?: string): void {
    this.notifications.warning(message, title);
  }

  info(message: string, title?: string): void {
    this.notifications.info(message, title);
  }

  dismiss(id: number): void {
    this.notifications.dismiss(id);
  }
}
