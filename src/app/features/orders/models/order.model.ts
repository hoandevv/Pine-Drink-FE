export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface Order {
  id: string;
  orderCode: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
}
