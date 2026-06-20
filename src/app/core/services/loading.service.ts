import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private pendingRequests = 0;

  readonly loading$ = this.loadingSubject.asObservable();

  show(): void {
    this.pendingRequests += 1;
    if (!this.loadingSubject.value) {
      this.loadingSubject.next(true);
    }
  }

  hide(): void {
    if (this.pendingRequests > 0) {
      this.pendingRequests -= 1;
    }

    if (this.pendingRequests === 0) {
      this.loadingSubject.next(false);
    }
  }

  reset(): void {
    this.pendingRequests = 0;
    this.loadingSubject.next(false);
  }
}
