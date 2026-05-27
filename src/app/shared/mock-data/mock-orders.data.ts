export interface MockOrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  size: 'S' | 'M' | 'L';
  iceLevel: number;
  sugarLevel: number;
  toppings: string[];
  note?: string;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  branchId: string;
  branchName: string;
  orderType: 'PICKUP' | 'DELIVERY';
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  items: MockOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  voucherCode?: string;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'MOMO' | 'ZALOPAY';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  deliveryAddress?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: string;
}

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'order-001',
    orderNumber: 'PD-9842',
    customerId: 'cust-001',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0912345678',
    customerEmail: 'nguyenvana@email.com',
    branchId: 'branch-001',
    branchName: 'Pine Drink Nguyễn Trãi',
    orderType: 'DELIVERY',
    status: 'PENDING',
    items: [
      {
        id: 'item-001',
        productId: 'prod-001',
        productName: 'Trà sữa trân châu đường đen',
        productImage: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80',
        quantity: 2,
        price: 39000,
        size: 'M',
        iceLevel: 70,
        sugarLevel: 100,
        toppings: ['Trân châu đen', 'Thạch rau câu'],
        note: 'Ít đá'
      }
    ],
    subtotal: 78000,
    shippingFee: 15000,
    discount: 0,
    total: 93000,
    paymentMethod: 'MOMO',
    paymentStatus: 'PENDING',
    deliveryAddress: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    createdAt: '2026-05-27T08:30:00Z',
    updatedAt: '2026-05-27T08:30:00Z',
    estimatedTime: '10-15 phút'
  },
  {
    id: 'order-002',
    orderNumber: 'PD-9841',
    customerId: 'cust-002',
    customerName: 'Trần Thị B',
    customerPhone: '0987654321',
    customerEmail: 'tranthib@email.com',
    branchId: 'branch-002',
    branchName: 'Pine Drink Cầu Giấy',
    orderType: 'PICKUP',
    status: 'PREPARING',
    items: [
      {
        id: 'item-002',
        productId: 'prod-002',
        productName: 'Matcha Latte kem cheese',
        productImage: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80',
        quantity: 1,
        price: 45000,
        size: 'L',
        iceLevel: 50,
        sugarLevel: 70,
        toppings: ['Kem cheese'],
        note: ''
      }
    ],
    subtotal: 45000,
    shippingFee: 0,
    discount: 9000,
    voucherCode: 'GIAM20K',
    total: 36000,
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    createdAt: '2026-05-27T08:15:00Z',
    updatedAt: '2026-05-27T08:45:00Z',
    estimatedTime: '5-10 phút'
  },
  {
    id: 'order-003',
    orderNumber: 'PD-9838',
    customerId: 'cust-003',
    customerName: 'Lê Văn C',
    customerPhone: '0901234567',
    customerEmail: 'levanc@email.com',
    branchId: 'branch-001',
    branchName: 'Pine Drink Nguyễn Trãi',
    orderType: 'DELIVERY',
    status: 'READY',
    items: [
      {
        id: 'item-003',
        productId: 'prod-003',
        productName: 'Trà đào cam sả',
        productImage: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80',
        quantity: 2,
        price: 42000,
        size: 'M',
        iceLevel: 100,
        sugarLevel: 70,
        toppings: ['Thạch đào'],
        note: ''
      },
      {
        id: 'item-004',
        productId: 'prod-010',
        productName: 'Cafe sữa đá',
        productImage: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=900&q=80',
        quantity: 1,
        price: 29000,
        size: 'M',
        iceLevel: 100,
        sugarLevel: 100,
        toppings: [],
        note: 'Đậm đà'
      }
    ],
    subtotal: 113000,
    shippingFee: 15000,
    discount: 0,
    total: 128000,
    paymentMethod: 'ZALOPAY',
    paymentStatus: 'PAID',
    deliveryAddress: '456 Xuân Thủy, Cầu Giấy, Hà Nội',
    createdAt: '2026-05-27T07:50:00Z',
    updatedAt: '2026-05-27T08:20:00Z',
    estimatedTime: '2-5 phút'
  },
  {
    id: 'order-004',
    orderNumber: 'PD-9835',
    customerId: 'cust-004',
    customerName: 'Phạm Thị D',
    customerPhone: '0976543210',
    customerEmail: 'phamthid@email.com',
    branchId: 'branch-004',
    branchName: 'Pine Drink Hoàn Kiếm',
    orderType: 'PICKUP',
    status: 'CANCELLED',
    items: [
      {
        id: 'item-005',
        productId: 'prod-009',
        productName: 'Cafe đen đá',
        productImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
        quantity: 1,
        price: 25000,
        size: 'M',
        iceLevel: 100,
        sugarLevel: 0,
        toppings: [],
        note: ''
      }
    ],
    subtotal: 25000,
    shippingFee: 0,
    discount: 0,
    total: 25000,
    paymentMethod: 'CASH',
    paymentStatus: 'FAILED',
    createdAt: '2026-05-27T07:30:00Z',
    updatedAt: '2026-05-27T07:45:00Z',
    note: 'Khách hàng hủy đơn'
  },
  {
    id: 'order-005',
    orderNumber: 'PD-9830',
    customerId: 'cust-005',
    customerName: 'Hoàng Văn E',
    customerPhone: '0965432109',
    customerEmail: 'hoangvane@email.com',
    branchId: 'branch-001',
    branchName: 'Pine Drink Nguyễn Trãi',
    orderType: 'DELIVERY',
    status: 'COMPLETED',
    items: [
      {
        id: 'item-006',
        productId: 'prod-001',
        productName: 'Trà sữa trân châu đường đen',
        productImage: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80',
        quantity: 1,
        price: 39000,
        size: 'L',
        iceLevel: 70,
        sugarLevel: 100,
        toppings: ['Trân châu đen'],
        note: ''
      },
      {
        id: 'item-007',
        productId: 'prod-006',
        productName: 'Chocolate đá xay',
        productImage: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=900&q=80',
        quantity: 1,
        price: 49000,
        size: 'M',
        iceLevel: 100,
        sugarLevel: 100,
        toppings: ['Kem tươi'],
        note: ''
      }
    ],
    subtotal: 88000,
    shippingFee: 0,
    discount: 0,
    voucherCode: 'PINEGO',
    total: 88000,
    paymentMethod: 'CARD',
    paymentStatus: 'PAID',
    deliveryAddress: '789 Quang Trung, Hà Đông, Hà Nội',
    createdAt: '2026-05-27T06:30:00Z',
    updatedAt: '2026-05-27T07:15:00Z'
  }
];
