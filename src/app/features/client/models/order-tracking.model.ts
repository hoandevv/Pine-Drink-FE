import { Order } from '../../orders/models/order.model';

export interface OrderStatusStep {
  key: string;
  label: string;
  icon: string;
  completed: boolean;
}

export type TrackingOrder = Order & {
  orderNumber: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  estimatedTime?: string;
  voucherCode?: string;
};
