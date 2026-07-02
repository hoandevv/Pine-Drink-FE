import { Component } from '@angular/core';

import { AccessControlService } from '../../../../core/services/access-control.service';

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

interface DeliveryMetric {
  title: string;
  value: string;
  note: string;
  icon: string;
}

interface DeliveryOrder {
  code: string;
  time: string;
  status: 'READY_FOR_PICKUP' | 'DELIVERING' | 'DELIVERED' | 'FAILED';
  customer: string;
  phone: string;
  address: string;
  branch: string;
  amount: string;
  items: string;
  action: string;
}

interface DeliveryNotice {
  title: string;
  description: string;
  unread: boolean;
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent {
  constructor(private readonly accessControl: AccessControlService) { }

  get isDeliveryOnly(): boolean {
    return this.accessControl.hasAnyRole(['DELIVERY']) && !this.accessControl.hasAnyRole(['ADMIN', 'MANAGER']);
  }

  readonly deliveryMetrics: DeliveryMetric[] = [
    { title: 'Đơn được giao hôm nay', value: '12', note: '+3 đơn so với hôm qua', icon: 'inventory_2' },
    { title: 'Đang giao', value: '3', note: 'Ưu tiên hoàn tất trước 15:00', icon: 'local_shipping' },
    { title: 'Đã giao thành công', value: '9', note: 'Tỷ lệ hoàn thành 92%', icon: 'check_circle' },
    { title: 'Giao thất bại', value: '1', note: 'Cần xác minh lại địa chỉ', icon: 'warning' }
  ];

  readonly deliveryOrders: DeliveryOrder[] = [
    {
      code: '#PD-1024',
      time: 'Hôm nay, 10:30 AM',
      status: 'DELIVERING',
      customer: 'Lê Minh Tuấn',
      phone: '090 123 4567',
      address: '24 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      branch: 'Pine Drink Flagship - Q.1',
      amount: '450.000đ',
      items: 'Pine Latte x2 · Matcha Cloud x1',
      action: 'Chi tiết & Bản đồ'
    },
    {
      code: '#PD-1025',
      time: 'Hôm nay, 11:15 AM',
      status: 'READY_FOR_PICKUP',
      customer: 'Trần Thị Hoa',
      phone: '098 765 4321',
      address: '88 Võ Văn Tần, Phường 6, Quận 3, TP. Hồ Chí Minh',
      branch: 'Pine Drink Station - Q.3',
      amount: '185.000đ',
      items: 'Mango Jasmine Tea x2',
      action: 'Xác nhận lấy hàng'
    },
    {
      code: '#PD-1026',
      time: 'Hôm nay, 11:42 AM',
      status: 'READY_FOR_PICKUP',
      customer: 'Nguyễn Ngọc Anh',
      phone: '091 777 2288',
      address: '12 Nguyễn Trãi, Bến Thành, Quận 1, TP. Hồ Chí Minh',
      branch: 'Pine Drink Express - Q.1',
      amount: '212.000đ',
      items: 'Caramel Freeze x1 · Topping Trân châu x2',
      action: 'Nhận đơn'
    }
  ];

  readonly deliveryNotices: DeliveryNotice[] = [
    { title: 'Hệ thống: Thưởng nóng', description: '+50k cho mỗi 5 đơn hoàn thành trước 12h trưa nay.', unread: true },
    { title: 'Điều phối: Đơn #PD-1025', description: 'Khách hàng yêu cầu giao trước cổng chính.', unread: true },
    { title: 'Cập nhật ứng dụng', description: 'Phiên bản v2.4.1 đã sẵn sàng để nâng cấp.', unread: false }
  ];

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
