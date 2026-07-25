import { PaymentMethod, PaymentStatus } from './order.model';

export interface RecordOfflinePaymentRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentTransactionResponse {
  id: string;
  transactionCode: string;
  orderId: string;
  orderCode: string;
  provider: PaymentMethod;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus | 'PENDING' | 'FAILED' | string;
  orderPaymentStatus: PaymentStatus;
  paidAt?: string;
  failedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MomoCreatePaymentRequest {
  orderId: string;
  orderInfo: string;
  extraData?: string;
}

export interface MomoCreatePaymentResponse {
  orderId: string;
  requestId: string;
  payUrl: string;
  deeplink: string;
  qrCodeUrl: string;
  resultCode: number;
  message: string;
  provider: string;
  paymentMethod: string;
  transactionId: string;
}

export interface CreateRefundRequest {
  transactionId: string;
  amount: number;
  reason?: string;
}

export interface RefundResponse {
  id: string;
  refundCode: string;
  transactionId: string;
  transactionCode: string;
  orderId: string;
  orderCode: string;
  amount: number;
  reason?: string;
  status: string;
  requestedById?: string;
  requestedByUsername?: string;
  requestedAt?: string;
  completedAt?: string;
}