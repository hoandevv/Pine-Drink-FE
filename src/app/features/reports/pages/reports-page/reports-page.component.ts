import { Component } from '@angular/core';

@Component({ selector: 'app-reports-page', templateUrl: './reports-page.component.html', styleUrls: ['./reports-page.component.scss'] })
export class ReportsPageComponent {
  readonly bars = [42, 58, 46, 72, 64, 88, 76, 95, 82, 100, 91, 112];
  readonly kpis = [
    { label: 'Doanh thu tháng', value: '286.4M', trend: '+18.2%' },
    { label: 'Đơn hoàn tất', value: '2,418', trend: '+11.6%' },
    { label: 'Tỉ lệ quay lại', value: '64%', trend: '+7.4%' }
  ];
}
