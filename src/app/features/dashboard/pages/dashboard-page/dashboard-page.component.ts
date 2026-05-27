import { Component } from '@angular/core';

interface MetricCard {
  title: string;
  value: string;
  delta: string;
}

interface BestSeller {
  name: string;
  sold: number;
  category: string;
}

interface RecentOrder {
  code: string;
  customer: string;
  amount: string;
  status: string;
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent {
  readonly metrics: MetricCard[] = [
    { title: 'Total Orders', value: '1,248', delta: '+12% vs yesterday' },
    { title: 'Revenue Today', value: '24,800,000 VND', delta: '+8.4% vs yesterday' },
    { title: 'Total Products', value: '86', delta: '4 san pham sap ra mat' },
    { title: 'Pending Orders', value: '18', delta: 'Can xu ly trong 15 phut' }
  ];

  readonly bestSellers: BestSeller[] = [
    { name: 'Pine Latte', sold: 124, category: 'Coffee' },
    { name: 'Mango Tea', sold: 98, category: 'Tea' },
    { name: 'Caramel Freeze', sold: 76, category: 'Blended' }
  ];

  readonly recentOrders: RecentOrder[] = [
    { code: 'ORD-240526-01', customer: 'Nguyen Lan', amount: '185,000 VND', status: 'Preparing' },
    { code: 'ORD-240526-02', customer: 'Tran Minh', amount: '96,000 VND', status: 'Pending' },
    { code: 'ORD-240526-03', customer: 'Walk-in', amount: '54,000 VND', status: 'Completed' }
  ];
}
