import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Subject } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { TokenService } from '../../../core/services/token.service';
import { Order } from '../models/order.model';

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

@Injectable({ providedIn: 'root' })
export class OrderRealtimeService implements OnDestroy {
  private readonly wsUrl = `${environment.apiBaseUrl.replace('/api/v1', '')}/ws`;
  private client?: Client;
  private readonly orderSubscriptions = new Map<string, StompSubscription>();
  private readonly branchSubscriptions = new Map<string, StompSubscription>();
  private readonly pendingOrderIds = new Set<string>();
  private readonly pendingBranchIds = new Set<string>();
  private isActivating = false;

  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly orderEventsSubject = new Subject<OrderRealtimeEnvelope>();
  private readonly errorsSubject = new Subject<string>();

  readonly connected$ = this.connectedSubject.asObservable();
  readonly orderEvents$ = this.orderEventsSubject.asObservable();
  readonly errors$ = this.errorsSubject.asObservable();

  constructor(
    private readonly tokenService: TokenService,
    private readonly ngZone: NgZone
  ) {}

  connect(): void {
    const token = this.tokenService.getAccessToken();
    if (!token) {
      this.errorsSubject.next('Missing access token for order realtime');
      return;
    }

    if (this.client?.connected) {
      this.flushPendingSubscriptions();
      return;
    }

    if (this.client?.active || this.isActivating) {
      return;
    }

    this.isActivating = true;
    this.client = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.ngZone.run(() => {
          this.isActivating = false;
          this.connectedSubject.next(true);
          this.flushPendingSubscriptions();
        });
      },
      onStompError: (frame) => this.ngZone.run(() => {
        this.errorsSubject.next(frame.headers['message'] || 'Order realtime STOMP error');
      }),
      onWebSocketClose: () => {
        this.ngZone.run(() => {
          this.isActivating = false;
          this.connectedSubject.next(false);
        });
      },
      onWebSocketError: () => this.ngZone.run(() => {
        this.errorsSubject.next('Order realtime websocket error');
      })
    });

    this.client.activate();
  }

  subscribeOrder(orderId: string): void {
    if (!orderId || this.orderSubscriptions.has(orderId)) {
      return;
    }

    this.pendingOrderIds.add(orderId);
    if (!this.client?.connected) {
      this.connect();
      return;
    }

    this.subscribePendingOrder(orderId);
  }

  subscribeBranchOrders(branchId: string): void {
    if (!branchId || this.branchSubscriptions.has(branchId)) {
      return;
    }

    this.pendingBranchIds.add(branchId);
    if (!this.client?.connected) {
      this.connect();
      return;
    }

    this.subscribePendingBranch(branchId);
  }

  unsubscribeOrder(orderId: string): void {
    this.orderSubscriptions.get(orderId)?.unsubscribe();
    this.orderSubscriptions.delete(orderId);
    this.pendingOrderIds.delete(orderId);
  }

  unsubscribeBranchOrders(branchId: string): void {
    this.branchSubscriptions.get(branchId)?.unsubscribe();
    this.branchSubscriptions.delete(branchId);
    this.pendingBranchIds.delete(branchId);
  }

  disconnect(): void {
    this.orderSubscriptions.forEach(subscription => subscription.unsubscribe());
    this.branchSubscriptions.forEach(subscription => subscription.unsubscribe());
    this.orderSubscriptions.clear();
    this.branchSubscriptions.clear();
    this.pendingOrderIds.clear();
    this.pendingBranchIds.clear();
    this.isActivating = false;
    this.client?.deactivate();
    this.client = undefined;
    this.connectedSubject.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private flushPendingSubscriptions(): void {
    [...this.pendingOrderIds].forEach(orderId => this.subscribePendingOrder(orderId));
    [...this.pendingBranchIds].forEach(branchId => this.subscribePendingBranch(branchId));
  }

  private subscribePendingOrder(orderId: string): void {
    if (this.orderSubscriptions.has(orderId)) {
      return;
    }

    const subscription = this.client?.subscribe(this.getOrderTopic(orderId), (message) => this.handleMessage(message));
    if (subscription) {
      this.orderSubscriptions.set(orderId, subscription);
    }
  }

  private subscribePendingBranch(branchId: string): void {
    if (this.branchSubscriptions.has(branchId)) {
      return;
    }

    const subscription = this.client?.subscribe(this.getBranchOrdersTopic(branchId), (message) => this.handleMessage(message));
    if (subscription) {
      this.branchSubscriptions.set(branchId, subscription);
    }
  }

  private getOrderTopic(orderId: string): string {
    return `/topic/orders.${orderId}`;
  }

  private getBranchOrdersTopic(branchId: string): string {
    return `/topic/branches.${branchId}.orders`;
  }

  private handleMessage(message: IMessage): void {
    this.ngZone.run(() => {
      try {
        const parsed = JSON.parse(message.body) as OrderRealtimeEnvelope | Order | Partial<Order>;
        this.orderEventsSubject.next(this.normalizeEnvelope(parsed));
      } catch {
        this.errorsSubject.next('Không parse được order realtime payload');
      }
    });
  }

  private normalizeEnvelope(value: OrderRealtimeEnvelope | Order | Partial<Order>): OrderRealtimeEnvelope {
    if (this.isEnvelope(value)) {
      const payload = this.extractPayload(value);
      const orderId = this.extractOrderId(value, payload);
      const branchId = this.extractBranchId(value, payload);

      return {
        ...value,
        type: value.type ?? value.eventType ?? 'ORDER_UPDATED',
        eventType: value.eventType ?? value.type ?? 'ORDER_UPDATED',
        targetId: value.targetId ?? orderId,
        orderId,
        branchId,
        payload
      };
    }

    const order = value as Partial<Order>;
    return {
      type: 'ORDER_UPDATED',
      eventType: 'ORDER_UPDATED',
      targetType: 'ORDER',
      targetId: order.id,
      orderId: order.id,
      branchId: order.branchId,
      payload: order
    };
  }

  private isEnvelope(value: OrderRealtimeEnvelope | Order | Partial<Order>): value is OrderRealtimeEnvelope {
    return 'payload' in value
      || 'data' in value
      || 'type' in value
      || 'eventType' in value
      || 'targetId' in value
      || 'orderId' in value;
  }

  private extractPayload(envelope: OrderRealtimeEnvelope): Record<string, unknown> {
    const rawPayload = envelope.payload || envelope.data || {};
    const payload = typeof rawPayload === 'object' && rawPayload !== null
      ? rawPayload as Record<string, unknown>
      : {};

    return {
      ...payload,
      id: payload['id'] ?? payload['orderId'] ?? envelope.orderId ?? envelope.targetId,
      branchId: payload['branchId'] ?? envelope.branchId
    };
  }

  private extractOrderId(envelope: OrderRealtimeEnvelope, payload: Record<string, unknown>): string | undefined {
    return String(payload['id'] || payload['orderId'] || envelope.orderId || envelope.targetId || '') || undefined;
  }

  private extractBranchId(envelope: OrderRealtimeEnvelope, payload: Record<string, unknown>): string | undefined {
    return String(payload['branchId'] || envelope.branchId || '') || undefined;
  }
}
