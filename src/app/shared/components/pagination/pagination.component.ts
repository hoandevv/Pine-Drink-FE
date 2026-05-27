import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
  @Input() page = 0;
  @Input() size = 10;
  @Input() totalElements = 0;
  @Input() totalPages = 0;
  @Output() pageChange = new EventEmitter<number>();

  get hasPrevious(): boolean {
    return this.page > 0;
  }

  get hasNext(): boolean {
    return this.page + 1 < this.totalPages;
  }

  previous(): void {
    if (this.hasPrevious) {
      this.pageChange.emit(this.page - 1);
    }
  }

  next(): void {
    if (this.hasNext) {
      this.pageChange.emit(this.page + 1);
    }
  }
}
