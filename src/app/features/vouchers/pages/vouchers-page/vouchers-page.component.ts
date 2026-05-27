import { Component } from '@angular/core';

@Component({ selector: 'app-vouchers-page', templateUrl: './vouchers-page.component.html', styleUrls: ['./vouchers-page.component.scss'] })
export class VouchersPageComponent {
  readonly vouchers = [
    { code: 'PINE20', name: 'Giảm 20% trà dứa', used: 342, limit: 600, expire: '30/06/2026' },
    { code: 'FREESHIP', name: 'Miễn phí giao hàng', used: 188, limit: 500, expire: '15/06/2026' },
    { code: 'SUMMER50', name: 'Summer combo -50K', used: 91, limit: 250, expire: '01/07/2026' }
  ];
}
