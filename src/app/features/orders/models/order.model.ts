export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type OrderType = 'DELIVERY' | 'PICKUP' | 'WALK_IN';
export type OrderPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export interface OrderItem {
  id: string;
  name: string;
  image?: string;
  size: string;
  variant?: string;
  toppings: { name: string; price: number }[];
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface OrderTimeline {
  status: OrderStatus;
  time: string;
  note?: string;
}

export interface Order {
  id: string;
  orderCode: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  totalAmount: number;
  subtotal: number;
  discount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  type: OrderType;
  priority: OrderPriority;
  items: OrderItem[];
  timeline: OrderTimeline[];
  note?: string;
  createdAt: string;
  updatedAt?: string;
}
