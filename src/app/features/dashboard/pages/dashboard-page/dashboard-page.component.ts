import { Component } from '@angular/core';

interface MetricCard {
  title: string;
  value: string;
  delta: string;
  icon: string;
  tone: 'green' | 'yellow' | 'mint' | 'orange';
}

interface BestSeller {
  name: string;
  sold: number;
  category: string;
  percent: number;
  emoji: string;
}

interface RecentOrder {
  code: string;
  customer: string;
  amount: string;
  status: 'Đang pha chế' | 'Chờ xử lý' | 'Hoàn tất';
  time: string;
}

interface ActivityItem {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent {
  readonly metrics: MetricCard[] = [
    { title: 'Tổng đơn hôm nay', value: '1,248', delta: '+12% so với hôm qua', icon: 'receipt_long', tone: 'green' },
    { title: 'Doanh thu', value: '24.8M', delta: '+8.4% tăng trưởng', icon: 'payments', tone: 'yellow' },
    { title: 'Sản phẩm đang bán', value: '86', delta: '4 món mới sắp ra mắt', icon: 'local_cafe', tone: 'mint' },
    { title: 'Đơn cần xử lý', value: '18', delta: 'Ưu tiên trong 15 phút', icon: 'hourglass_top', tone: 'orange' }
  ];

  readonly bestSellers: BestSeller[] = [
    { name: 'Pine Latte Signature', sold: 124, category: 'Coffee', percent: 92, emoji: '🍍' },
    { name: 'Mango Jasmine Tea', sold: 98, category: 'Tea', percent: 78, emoji: '🥭' },
    { name: 'Caramel Freeze', sold: 76, category: 'Blended', percent: 64, emoji: '🥤' },
    { name: 'Matcha Coco Cloud', sold: 61, category: 'Milk Tea', percent: 52, emoji: '🍵' }
  ];

  readonly recentOrders: RecentOrder[] = [
    { code: 'ORD-240526-01', customer: 'Nguyễn Lan', amount: '185.000đ', status: 'Đang pha chế', time: '2 phút trước' },
    { code: 'ORD-240526-02', customer: 'Trần Minh', amount: '96.000đ', status: 'Chờ xử lý', time: '8 phút trước' },
    { code: 'ORD-240526-03', customer: 'Walk-in', amount: '54.000đ', status: 'Hoàn tất', time: '15 phút trước' },
    { code: 'ORD-240526-04', customer: 'Hoàng Anh', amount: '142.000đ', status: 'Đang pha chế', time: '21 phút trước' }
  ];

  readonly activities: ActivityItem[] = [
    { title: 'Kho nguyên liệu ổn định', description: 'Dứa tươi còn đủ cho 148 ly signature.', icon: 'inventory_2' },
    { title: 'Ca chiều sắp bắt đầu', description: '3 nhân viên check-in trong 20 phút tới.', icon: 'groups' },
    { title: 'Voucher đang chạy tốt', description: 'PINELOVE giảm 15% đã dùng 86 lượt.', icon: 'sell' }
  ];
}
