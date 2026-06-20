export interface MockVoucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  tone: 'primary' | 'cream' | 'green';
  image?: string;
}

export const MOCK_VOUCHERS: MockVoucher[] = [
  {
    id: 'voucher-001',
    code: 'PINEWED',
    title: 'Mua 2 tặng 1 mỗi thứ 4',
    description: 'Áp dụng cho dòng trà trái cây và trà sữa size M.',
    discountType: 'PERCENTAGE',
    discountValue: 33,
    minOrderAmount: 80000,
    maxDiscountAmount: 50000,
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    usageLimit: 1000,
    usedCount: 342,
    isActive: true,
    tone: 'primary',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'voucher-002',
    code: 'PINEWELCOME',
    title: 'Giảm 20% đơn đầu tiên',
    description: 'Dành riêng cho tài khoản mới đặt hàng online.',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: 50000,
    maxDiscountAmount: 30000,
    startDate: '2026-05-01',
    endDate: '2026-12-31',
    usageLimit: 5000,
    usedCount: 1234,
    isActive: true,
    tone: 'cream',
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'voucher-003',
    code: 'PINEGO',
    title: 'Freeship gần chi nhánh',
    description: 'Miễn phí giao hàng trong bán kính 3km.',
    discountType: 'FREE_SHIPPING',
    discountValue: 15000,
    minOrderAmount: 40000,
    startDate: '2026-05-01',
    endDate: '2026-07-31',
    usageLimit: 2000,
    usedCount: 567,
    isActive: true,
    tone: 'cream',
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'voucher-004',
    code: 'GIAM20K',
    title: 'Giảm 20K cho đơn từ 100K',
    description: 'Áp dụng cho tất cả sản phẩm, không giới hạn số lần sử dụng.',
    discountType: 'FIXED_AMOUNT',
    discountValue: 20000,
    minOrderAmount: 100000,
    startDate: '2026-05-20',
    endDate: '2026-06-10',
    usageLimit: 500,
    usedCount: 89,
    isActive: true,
    tone: 'primary',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'voucher-005',
    code: 'MATCHA50',
    title: 'Giảm 50% dòng Matcha',
    description: 'Khuyến mãi đặc biệt cho tất cả sản phẩm Matcha.',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    minOrderAmount: 0,
    maxDiscountAmount: 25000,
    startDate: '2026-05-25',
    endDate: '2026-06-05',
    usageLimit: 300,
    usedCount: 156,
    isActive: true,
    tone: 'green',
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'voucher-006',
    code: 'WEEKEND30',
    title: 'Giảm 30% cuối tuần',
    description: 'Áp dụng thứ 7 và chủ nhật cho tất cả đơn hàng.',
    discountType: 'PERCENTAGE',
    discountValue: 30,
    minOrderAmount: 60000,
    maxDiscountAmount: 40000,
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    usageLimit: 1500,
    usedCount: 678,
    isActive: true,
    tone: 'primary',
    image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=900&q=80'
  }
];
