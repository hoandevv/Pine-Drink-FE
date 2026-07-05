import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarScrollService {
  private scrollTop = 0;
  private hasSaved = false;

  save(scrollTop: number): void {
    this.scrollTop = scrollTop;
    this.hasSaved = true;
  }

  hasSavedPosition(): boolean {
    return this.hasSaved;
  }

  restore(element: HTMLElement | null | undefined): void {
    if (!element) return;

    let attempts = 0;
    const restoreWhenReady = () => {
      const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
      element.scrollTop = Math.min(this.scrollTop, maxScrollTop);

      attempts += 1;
      if (attempts < 6 && element.scrollTop !== this.scrollTop) {
        requestAnimationFrame(restoreWhenReady);
      }
    };

    requestAnimationFrame(restoreWhenReady);
  }
}
