import { Component, EventEmitter, Input, Output } from '@angular/core';

import { PageResponse } from '../../../../shared/models/page-response.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-table',
  templateUrl: './product-table.component.html',
  styleUrls: ['./product-table.component.scss']
})
export class ProductTableComponent {
  @Input() products: Product[] = [];
  @Input() loading = false;
  @Input() pageData!: PageResponse<Product>;
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();

  trackById(_index: number, item: Product): string {
    return item.id;
  }
}
