import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Subject } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';
import { TokenService } from '../../../core/services/token.service';
import { Order } from '../models/order.model';
import { OrderRealtimeEnvelope, OrderRealtimePayload } from '../models/order-realtime.model';

@Injectable({ providedIn: 'root' })
export class OrderRealtimeService implements OnDestroy {
  private readonly wsUrl = `${environment.apiBaseUrl.replace('/api/v1', '')}${API_ENDPOINTS.websocket.base}`;

  private client?: Client;
  private isActivating = false;

  private readonly orderSubscriptions = new Map<string, StompSubscription>();
  private readonly branchSubscriptions = new Map<string, StompSubscription>();

  private readonly pendingOrderIds = new Set<string>();
  private readonly pendingBranchIds = new Set<string>();

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
      this.sendError('Missing access token for order realtime');
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
    this.client = this.createClient(token);
    this.client.activate();
  }

  subscribeOrder(orderId: string): void {
    if (!orderId || this.orderSubscriptions.has(orderId)) {
      return;
    }

    this.pendingOrderIds.add(orderId);
    this.connectIfNeeded();
    this.subscribePendingOrder(orderId);
  }

  subscribeBranchOrders(branchId: string): void {
    if (!branchId || this.branchSubscriptions.has(branchId)) {
      return;
    }

    this.pendingBranchIds.add(branchId);
    this.connectIfNeeded();
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
    this.unsubscribeAll();
    this.clearPendingSubscriptions();

    this.isActivating = false;
    this.client?.deactivate();
    this.client = undefined;
    this.connectedSubject.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private createClient(token: string): Client {
    return new Client({
      webSocketFactory: () => new SockJS(this.wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => this.handleConnected(),
      onStompError: (frame) => this.sendError(frame.headers['message'] || 'Order realtime STOMP error'),
      onWebSocketClose: () => this.handleDisconnected(),
      onWebSocketError: () => this.sendError('Order realtime websocket error')
    });
  }

  private handleConnected(): void {
    this.ngZone.run(() => {
      this.isActivating = false;
      this.connectedSubject.next(true);
      this.flushPendingSubscriptions();
    });
  }

  private handleDisconnected(): void {
    this.ngZone.run(() => {
      this.isActivating = false;
      this.connectedSubject.next(false);
    });
  }

  private sendError(message: string): void {
    this.ngZone.run(() => this.errorsSubject.next(message));
  }

  private connectIfNeeded(): void {
    if (!this.client?.connected) {
      this.connect();
    }
  }

  private flushPendingSubscriptions(): void {
    this.pendingOrderIds.forEach((orderId) => this.subscribePendingOrder(orderId));
    this.pendingBranchIds.forEach((branchId) => this.subscribePendingBranch(branchId));
  }

  private subscribePendingOrder(orderId: string): void {
    if (!this.client?.connected || this.orderSubscriptions.has(orderId)) {
      return;
    }

    const topic = this.getOrderTopic(orderId);
    const subscription = this.client.subscribe(topic, (message) => this.handleMessage(message));

    this.orderSubscriptions.set(orderId, subscription);
  }

  private subscribePendingBranch(branchId: string): void {
    if (!this.client?.connected || this.branchSubscriptions.has(branchId)) {
      return;
    }

    const topic = this.getBranchOrdersTopic(branchId);
    const subscription = this.client.subscribe(topic, (message) => this.handleMessage(message));

    this.branchSubscriptions.set(branchId, subscription);
  }

  private unsubscribeAll(): void {
    this.orderSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.branchSubscriptions.forEach((subscription) => subscription.unsubscribe());

    this.orderSubscriptions.clear();
    this.branchSubscriptions.clear();
  }

  private clearPendingSubscriptions(): void {
    this.pendingOrderIds.clear();
    this.pendingBranchIds.clear();
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
        const parsed = JSON.parse(message.body) as OrderRealtimePayload;
        const event = this.normalizeEnvelope(parsed);
        this.orderEventsSubject.next(event);
      } catch {
        this.errorsSubject.next('Không parse được order realtime payload');
      }
    });
  }

  private normalizeEnvelope(value: OrderRealtimePayload): OrderRealtimeEnvelope {
    if (this.isEnvelope(value)) {
      return this.normalizeExistingEnvelope(value);
    }

    return this.createEnvelopeFromOrder(value);
  }

  private normalizeExistingEnvelope(envelope: OrderRealtimeEnvelope): OrderRealtimeEnvelope {
    const payload = this.extractPayload(envelope);
    const orderId = this.extractOrderId(envelope, payload);
    const branchId = this.extractBranchId(envelope, payload);
    let eventType = envelope.eventType;
    if (!eventType) {
      eventType = envelope.type;
    }
    if (!eventType) {
      eventType = 'ORDER_UPDATED';
    }

    let targetId = envelope.targetId;
    if (!targetId) {
      targetId = orderId;
    }

    return {
      ...envelope,
      type: eventType,
      eventType,
      targetId,
      orderId,
      branchId,
      payload
    };
  }

  private createEnvelopeFromOrder(order: Partial<Order>): OrderRealtimeEnvelope {
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

  private isEnvelope(value: OrderRealtimePayload): value is OrderRealtimeEnvelope {
    return 'payload' in value
      || 'data' in value
      || 'type' in value
      || 'eventType' in value
      || 'targetId' in value
      || 'orderId' in value;
  }

  private extractPayload(envelope: OrderRealtimeEnvelope): Record<string, unknown> {
    const rawPayload = envelope.payload || envelope.data || {};
    const payload = this.toRecord(rawPayload);

    let id = payload['id'];
    if (!id) {
      id = payload['orderId'];
    }
    if (!id) {
      id = envelope.orderId;
    }
    if (!id) {
      id = envelope.targetId;
    }

    let branchId = payload['branchId'];
    if (!branchId) {
      branchId = envelope.branchId;
    }

    return {
      ...payload,
      id,
      branchId
    };
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private extractOrderId(envelope: OrderRealtimeEnvelope, payload: Record<string, unknown>): string | undefined {
    return this.toOptionalString(payload['id'] || payload['orderId'] || envelope.orderId || envelope.targetId);
  }

  private extractBranchId(envelope: OrderRealtimeEnvelope, payload: Record<string, unknown>): string | undefined {
    return this.toOptionalString(payload['branchId'] || envelope.branchId);
  }

  private toOptionalString(value: unknown): string | undefined {
    const text = String(value || '');
    return text || undefined;
  }
}