export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | string;
export type OrderType = 'DELIVERY' | 'PICKUP' | 'WALK_IN';
export type OrderPriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type PaymentMethod = 'CASH' | 'COD' | 'VNPAY' | 'MOMO' | 'BANK_TRANSFER' | string;

export interface CreateOrderRequest {
  branchId: string;
  orderType: 'PICKUP' | 'DELIVERY';
  paymentMethod: PaymentMethod;
  pickupTime?: string;
  deliveryAddressId?: string;
  note?: string;
  voucherCode?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  reason?: string;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface OrderItemTopping {
  id: string;
  toppingId?: string;
  toppingName?: string;
  name?: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  name?: string;
  image?: string;
  imageUrl?: string;
  productImage?: string;
  productImageUrl?: string;
  variantId?: string;
  variantName?: string;
  variant?: string;
  size?: string;
  quantity: number;
  sugarLevel?: string;
  iceLevel?: string;
  note?: string;
  unitPrice?: number;
  price?: number;
  totalPrice: number;
  toppings: OrderItemTopping[];
}

export interface OrderTimeline {
  status: OrderStatus;
  time: string;
  note?: string;
}

export interface Order {
  id: string;
  orderCode: string;
  status: OrderStatus;
  branchId?: string;
  branchName?: string;
  branchAddress?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  orderType?: OrderType;
  type?: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotalAmount?: number;
  subtotal?: number;
  discountAmount?: number;
  discount?: number;
  deliveryFee?: number;
  totalAmount: number;
  pickupTime?: string;
  deliveryAddress?: string;
  priority?: OrderPriority;
  items: OrderItem[];
  timeline?: OrderTimeline[];
  note?: string;
  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  preparedAt?: string;
  readyAt?: string;
  deliveringAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
  cancelReason?: string;
}

