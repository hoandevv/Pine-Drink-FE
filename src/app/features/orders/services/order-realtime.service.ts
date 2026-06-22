import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Subject } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { TokenService } from '../../../core/services/token.service';
import { Order } from '../models/order.model';

export interface OrderRealtimeEnvelope<T = Order | Partial<Order>> {
  eventId?: string;
  type?: string;
  eventType?: string;
  targetType?: string;
  targetId?: string;
  payload?: T;
  data?: T;
  occurredAt?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderRealtimeService implements OnDestroy {
  private readonly wsUrl = `${environment.apiBaseUrl.replace('/api/v1', '')}/ws`;
  private client?: Client;
  private orderSubscriptions = new Map<string, StompSubscription>();
  private branchSubscriptions = new Map<string, StompSubscription>();
  private pendingOrderIds = new Set<string>();
  private pendingBranchIds = new Set<string>();
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
      onStompError: (frame) => this.errorsSubject.next(frame.headers['message'] || 'Order realtime STOMP error'),
      onWebSocketClose: () => {
        this.ngZone.run(() => {
          this.isActivating = false;
          this.connectedSubject.next(false);
        });
      },
      onWebSocketError: () => this.errorsSubject.next('Order realtime websocket error')
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

    const subscription = this.client.subscribe(`/topic/orders.${orderId}`, (message) => this.handleMessage(message));
    this.orderSubscriptions.set(orderId, subscription);
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

    const subscription = this.client.subscribe(`/topic/branches.${branchId}.orders`, (message) => this.handleMessage(message));
    this.branchSubscriptions.set(branchId, subscription);
  }

  unsubscribeOrder(orderId: string): void {
    this.orderSubscriptions.get(orderId)?.unsubscribe();
    this.orderSubscriptions.delete(orderId);
    this.pendingOrderIds.delete(orderId);
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
    [...this.pendingOrderIds].forEach(orderId => {
      if (!this.orderSubscriptions.has(orderId)) {
        const subscription = this.client?.subscribe(`/topic/orders.${orderId}`, (message) => this.handleMessage(message));
        if (subscription) {
          this.orderSubscriptions.set(orderId, subscription);
        }
      }
    });

    [...this.pendingBranchIds].forEach(branchId => {
      if (!this.branchSubscriptions.has(branchId)) {
        const subscription = this.client?.subscribe(`/topic/branches.${branchId}.orders`, (message) => this.handleMessage(message));
        if (subscription) {
          this.branchSubscriptions.set(branchId, subscription);
        }
      }
    });
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
    if ('payload' in value || 'data' in value || 'type' in value || 'eventType' in value) {
      return value as OrderRealtimeEnvelope;
    }

    const order = value as Partial<Order>;
    return {
      type: 'ORDER_UPDATED',
      targetType: 'ORDER',
      targetId: order.id,
      payload: order
    };
  }
}
