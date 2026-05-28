import { Component } from '@angular/core';

@Component({
  selector: 'app-toppings-page',
  templateUrl: './toppings-page.component.html',
  styleUrls: ['./toppings-page.component.scss']
})
export class ToppingsPageComponent {
  readonly toppings = [
    { name: 'Trân châu đen', stock: 82, unit: 'kg', price: '8.000đ', status: 'Còn hàng' },
    { name: 'Pudding trứng', stock: 34, unit: 'khay', price: '10.000đ', status: 'Sắp hết' },
    { name: 'Thạch dừa', stock: 64, unit: 'kg', price: '7.000đ', status: 'Còn hàng' },
    { name: 'Kem cheese', stock: 18, unit: 'lít', price: '12.000đ', status: 'Sắp hết' }
  ];
}
