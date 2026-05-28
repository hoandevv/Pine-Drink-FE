import { Component } from '@angular/core';

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss']
})
export class CategoriesPageComponent {
  readonly categories = [
    { name: 'Trà trái cây', code: 'FRUIT_TEA', products: 18, status: 'ACTIVE', revenue: '42.8M', color: '#f59e0b' },
    { name: 'Milk Tea Signature', code: 'MILK_TEA', products: 24, status: 'ACTIVE', revenue: '68.2M', color: '#8b5cf6' },
    { name: 'Smoothie Dứa', code: 'PINE_SMOOTHIE', products: 9, status: 'ACTIVE', revenue: '31.4M', color: '#22c55e' },
    { name: 'Coffee & Latte', code: 'COFFEE', products: 12, status: 'DRAFT', revenue: '16.9M', color: '#92400e' }
  ];
}
