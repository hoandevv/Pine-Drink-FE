import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export interface LoadingOverlayState {
  visible: boolean;
  message: string;
  subtitle?: string;
}

@Injectable({ providedIn: 'root' })
export class LoadingOverlayService {
  private pendingRequests = 0;
  private readonly stateSubject = new BehaviorSubject<LoadingOverlayState>({
    visible: false,
    message: 'Đang xử lý...',
    subtitle: 'Vui lòng chờ trong giây lát'
  });

  readonly state$ = this.stateSubject.asObservable();
  readonly loading$ = this.state$.pipe(map((state) => state.visible));

  show(message = 'Đang xử lý...', subtitle = 'Vui lòng chờ trong giây lát'): void {
    this.pendingRequests += 1;
    this.stateSubject.next({ visible: true, message, subtitle });
  }

  hide(): void {
    if (this.pendingRequests > 0) {
      this.pendingRequests -= 1;
    }

    if (this.pendingRequests === 0) {
      this.stateSubject.next({ ...this.stateSubject.value, visible: false });
    }
  }

  reset(): void {
    this.pendingRequests = 0;
    this.stateSubject.next({
      visible: false,
      message: 'Đang xử lý...',
      subtitle: 'Vui lòng chờ trong giây lát'
    });
  }
}

@Injectable({ providedIn: 'root' })
export class LoadingService {
  constructor(private readonly overlay: LoadingOverlayService) {}

  readonly state$ = this.overlay.state$;
  readonly loading$ = this.overlay.loading$;

  show(message?: string, subtitle?: string): void {
    this.overlay.show(message, subtitle);
  }

  hide(): void {
    this.overlay.hide();
  }

  reset(): void {
    this.overlay.reset();
  }
}
