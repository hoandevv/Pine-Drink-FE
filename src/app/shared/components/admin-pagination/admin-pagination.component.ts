import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-admin-pagination',
  templateUrl: './admin-pagination.component.html',
  styleUrls: ['./admin-pagination.component.scss']
})
export class AdminPaginationComponent {
  @Input() page = 0;
  @Input() totalPages = 0;
  @Input() totalItems = 0;
  @Input() pageSize = 12;
  @Input() pageSizeOptions: number[] = [6, 12, 24, 48];
  @Input() itemLabel = 'bản ghi';
  @Input() showPageSize = true;
  @Input() disabled = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get safeTotalPages(): number {
    return this.totalPages || 1;
  }

  get displayPage(): number {
    return Math.min(this.page + 1, this.safeTotalPages);
  }

  get statusText(): string {
    if (!this.totalItems) {
      return 'Không có dữ liệu';
    }

    return `Trang ${this.displayPage} / ${this.safeTotalPages} · ${this.totalItems} ${this.itemLabel}`;
  }

  get mobilePageText(): string {
    return this.totalItems ? `Trang ${this.displayPage}/${this.safeTotalPages}` : 'Không có dữ liệu';
  }

  get mobileCountText(): string {
    return this.totalItems ? `${this.totalItems} ${this.itemLabel}` : '';
  }

  get previousDisabled(): boolean {
    return this.disabled || this.page <= 0;
  }

  get nextDisabled(): boolean {
    return this.disabled || this.page >= this.safeTotalPages - 1;
  }

  previous(): void {
    if (!this.previousDisabled) {
      this.pageChange.emit(this.page - 1);
    }
  }

  next(): void {
    if (!this.nextDisabled) {
      this.pageChange.emit(this.page + 1);
    }
  }

  changePageSize(value: number | string): void {
    const nextSize = Number(value);
    if (!this.disabled && Number.isFinite(nextSize) && nextSize > 0) {
      this.pageSizeChange.emit(nextSize);
    }
  }
}
