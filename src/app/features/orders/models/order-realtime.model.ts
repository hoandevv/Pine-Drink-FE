import { Order } from './order.model';

export type OrderRealtimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_UPDATED'
  | string;

export interface OrderRealtimeEnvelope<T = Order | Partial<Order> | Record<string, unknown>> {
  eventId?: string;
  type?: OrderRealtimeEventType;
  eventType?: OrderRealtimeEventType;
  targetType?: string;
  targetId?: string;
  orderId?: string;
  branchId?: string;
  payload?: T;
  data?: T;
  occurredAt?: string;
}

export type OrderRealtimePayload = OrderRealtimeEnvelope | Order | Partial<Order>;