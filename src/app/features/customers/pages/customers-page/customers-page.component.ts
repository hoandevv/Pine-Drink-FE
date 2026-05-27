import { Component } from '@angular/core';

@Component({ selector: 'app-customers-page', templateUrl: './customers-page.component.html', styleUrls: ['./customers-page.component.scss'] })
export class CustomersPageComponent {
  readonly customers = [
    { name: 'Nguyễn Hoàng An', phone: '0901 222 345', tier: 'Diamond', orders: 42, spent: '12.8M', last: 'Hôm nay' },
    { name: 'Trần Minh Tú', phone: '0918 445 102', tier: 'Gold', orders: 25, spent: '7.4M', last: '2 giờ trước' },
    { name: 'Lê Khánh Vy', phone: '0933 120 777', tier: 'Silver', orders: 13, spent: '3.1M', last: 'Hôm qua' }
  ];
}
