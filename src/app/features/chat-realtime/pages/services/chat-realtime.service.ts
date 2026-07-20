import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API_ENDPOINTS } from 'src/app/core/constants/api-endpoints';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { PageResponse } from 'src/app/shared/models/page-response.model';
import { TokenService } from 'src/app/core/services/token.service';

import {
  ChatRoomResponse,
  ChatMessageResponse,
  CreateChatRoomRequest,
  SendChatMessageRequest,
  ChatRoomRealtimeEvent,
  ChatMessagePayload,
  RealtimeEnvelope
} from '../../models/chat-realtime.model';

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService implements OnDestroy {
  private readonly apiUrl = `${environment.apiBaseUrl}${API_ENDPOINTS.chat.rooms}`;
  private readonly wsUrl = `${environment.apiBaseUrl.replace('/api/v1', '')}${API_ENDPOINTS.websocket.base}`;
  private client?: Client;
  private roomSubscription?: StompSubscription;
  private readonly branchSubscriptions = new Map<string, StompSubscription>();
  private userSubscription?: StompSubscription;
  private isActivating = false;
  private pendingRoomId?: string;
  private readonly pendingBranchIds = new Set<string>();
  private subscribedRoomId?: string;
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly messagesSubject = new Subject<ChatMessageResponse>();
  private readonly roomsSubject = new Subject<ChatRoomResponse>();
  private readonly errorsSubject = new Subject<string>();

  connected$ = this.connectedSubject.asObservable();
  messages$ = this.messagesSubject.asObservable();
  rooms$ = this.roomsSubject.asObservable();
  errors$ = this.errorsSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService,
    private readonly ngZone: NgZone
  ) {}

  createRoom(request: CreateChatRoomRequest): Observable<BaseResponse<ChatRoomResponse>> {
    return this.http.post<BaseResponse<ChatRoomResponse>>(this.apiUrl, request);
  }

  getRooms(page = 0, size = 20, branchId?: string): Observable<BaseResponse<PageResponse<ChatRoomResponse>>> {
    return this.getStaffRooms(branchId, page, size);
  }

  getMyRooms(page = 0, size = 20): Observable<BaseResponse<PageResponse<ChatRoomResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<BaseResponse<PageResponse<ChatRoomResponse>>>(this.apiUrl, { params });
  }

  getStaffRooms(branchId?: string, page = 0, size = 20): Observable<BaseResponse<PageResponse<ChatRoomResponse>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (branchId) {
      params = params.set('branchId', branchId);
    }
    return this.http.get<BaseResponse<PageResponse<ChatRoomResponse>>>(`${this.apiUrl}/staff`, { params });
  }

  getRoom(roomId: string): Observable<BaseResponse<ChatRoomResponse>> {
    return this.http.get<BaseResponse<ChatRoomResponse>>(`${this.apiUrl}/${roomId}`);
  }


  getMessages(roomId: string, page = 0, size = 30): Observable<BaseResponse<PageResponse<ChatMessageResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<BaseResponse<PageResponse<ChatMessageResponse>>>(`${this.apiUrl}/${roomId}/messages`, { params });
  }

  connect(roomId?: string, branchId?: string): void {
    const token = this.tokenService.getAccessToken();
    if (!token) {
      this.errorsSubject.next('Missing access token. Login trước bro.');
      return;
    }

    this.pendingRoomId = roomId || this.pendingRoomId;
    if (branchId) {
      this.pendingBranchIds.add(branchId);
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
        this.isActivating = false;
        this.connectedSubject.next(true);
        this.subscribeUserQueue();
        this.flushPendingSubscriptions();
      },
      onStompError: (frame) => {
        this.errorsSubject.next(frame.headers['message'] || 'STOMP error');
      },
      onWebSocketClose: () => {
        this.isActivating = false;
        this.connectedSubject.next(false);
      },
      onWebSocketError: () => this.errorsSubject.next('WebSocket connection error')
    });

    this.client.activate();
  }

  subscribeRoom(roomId: string): void {
    this.pendingRoomId = roomId;
    if (!this.client?.connected) {
      this.connect(roomId);
      return;
    }

    if (this.subscribedRoomId === roomId && this.roomSubscription) {
      return;
    }

    this.roomSubscription?.unsubscribe();
    this.subscribedRoomId = roomId;
    this.roomSubscription = this.client.subscribe(`/topic/chat.rooms.${roomId}`, (message) => this.handleRealtime(message));
  }

  subscribeBranch(branchId: string): void {
    this.pendingBranchIds.add(branchId);
    if (!this.client?.connected) {
      this.connect(undefined, branchId);
      return;
    }

    if (this.branchSubscriptions.has(branchId)) {
      return;
    }

    const subscription = this.client.subscribe(`/topic/branches.${branchId}.chat.rooms`, (message) => this.handleRealtime(message));
    this.branchSubscriptions.set(branchId, subscription);
  }

  subscribeBranches(branchIds: string[]): void {
    const uniqueBranchIds = [...new Set(branchIds.filter(Boolean))];
    uniqueBranchIds.forEach((branchId) => this.pendingBranchIds.add(branchId));

    if (!this.client?.connected) {
      this.connect();
      return;
    }

    uniqueBranchIds.forEach((branchId) => this.subscribeBranch(branchId));
  }

  setBranchSubscriptions(branchIds: string[]): void {
    const nextBranchIds = new Set(branchIds.filter(Boolean));

    this.pendingBranchIds.clear();
    nextBranchIds.forEach((branchId) => this.pendingBranchIds.add(branchId));

    for (const [branchId, subscription] of this.branchSubscriptions.entries()) {
      if (!nextBranchIds.has(branchId)) {
        subscription.unsubscribe();
        this.branchSubscriptions.delete(branchId);
      }
    }

    if (!this.client?.connected) {
      this.connect();
      return;
    }

    nextBranchIds.forEach((branchId) => this.subscribeBranch(branchId));
  }

  private flushPendingSubscriptions(): void {
    const roomId = this.pendingRoomId;
    const branchIds = [...this.pendingBranchIds];

    if (roomId) {
      this.subscribeRoom(roomId);
    }

    branchIds.forEach((branchId) => this.subscribeBranch(branchId));
  }

  sendMessage(request: SendChatMessageRequest): void {
    if (!this.client?.connected) {
      this.errorsSubject.next('Realtime chưa connect. Đợi vài giây rồi gửi lại bro.');
      return;
    }

    let metadataValue = null;
    if (request.metadata !== undefined && request.metadata !== null) {
      metadataValue = request.metadata;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ ...request, metadata: metadataValue })
    });
  }

  disconnect(): void {
    this.roomSubscription?.unsubscribe();
    this.branchSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.userSubscription?.unsubscribe();
    this.roomSubscription = undefined;
    this.branchSubscriptions.clear();
    this.userSubscription = undefined;
    this.subscribedRoomId = undefined;
    this.pendingRoomId = undefined;
    this.pendingBranchIds.clear();
    this.isActivating = false;
    this.client?.deactivate();
    this.client = undefined;
    this.connectedSubject.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private subscribeUserQueue(): void {
    this.userSubscription?.unsubscribe();
    this.userSubscription = this.client?.subscribe('/user/queue/chat', (message) => this.handleRealtime(message));
  }

  private handleRealtime(message: IMessage): void {
    this.ngZone.run(() => {
      try {
        const parsed = JSON.parse(message.body) as ChatMessageResponse | ChatRoomResponse | RealtimeEnvelope<ChatMessageResponse | ChatRoomResponse | ChatMessagePayload> | ChatRoomRealtimeEvent;
        const payload = this.unwrapPayload(parsed);
        if (this.isMessage(payload)) {
          this.messagesSubject.next(payload);
          return;
        }
        if (this.isRoom(payload)) {
          this.roomsSubject.next(payload);
        }
      } catch {
        this.errorsSubject.next('Không parse được realtime payload');
      }
    });
  }

  private unwrapPayload(parsed: ChatMessageResponse | ChatRoomResponse | RealtimeEnvelope<ChatMessageResponse | ChatRoomResponse | ChatMessagePayload> | ChatRoomRealtimeEvent): ChatMessageResponse | ChatRoomResponse | undefined {
    if (this.isMessage(parsed) || this.isRoom(parsed)) {
      return parsed;
    }
    const event = parsed as ChatRoomRealtimeEvent;
    const payload = event.message || event.room || event.data || event.payload;
    if (this.isMessage(payload) || this.isRoom(payload)) {
      return payload;
    }
    if (this.isMessagePayload(payload)) {
      return this.toMessageResponse(payload);
    }
    return undefined;
  }

  private isMessage(value: unknown): value is ChatMessageResponse {
    return !!value && typeof value === 'object' && 'roomId' in value && 'senderAccountId' in value;
  }

  private isRoom(value: unknown): value is ChatRoomResponse {
    return !!value && typeof value === 'object' && 'roomCode' in value && 'status' in value;
  }

  private isMessagePayload(value: unknown): value is ChatMessagePayload {
    return !!value && typeof value === 'object' && 'roomId' in value && ('messageId' in value || 'senderId' in value);
  }

  private toMessageResponse(payload: ChatMessagePayload): ChatMessageResponse {
    let messageId = '';
    if (payload.id) {
      messageId = payload.id;
    } else if (payload.messageId) {
      messageId = payload.messageId;
    } else {
      let time = '';
      if (payload.sentAt) {
        time = payload.sentAt;
      } else {
        time = Date.now().toString();
      }
      messageId = `${payload.roomId}-${time}`;
    }

    let senderAccountId = '';
    if (payload.senderAccountId) {
      senderAccountId = payload.senderAccountId;
    } else if (payload.senderId) {
      senderAccountId = payload.senderId;
    }

    let senderType = null;
    if (payload.senderType !== undefined && payload.senderType !== null) {
      senderType = payload.senderType;
    }

    let senderName = null;
    if (payload.senderName !== undefined && payload.senderName !== null) {
      senderName = payload.senderName;
    }

    let messageType = 'TEXT';
    if (payload.messageType) {
      messageType = payload.messageType;
    }

    let content = null;
    if (payload.content !== undefined && payload.content !== null) {
      content = payload.content;
    }

    let metadata = null;
    if (payload.metadata !== undefined && payload.metadata !== null) {
      metadata = payload.metadata;
    }

    let createdAt = '';
    if (payload.createdAt) {
      createdAt = payload.createdAt;
    } else if (payload.sentAt) {
      createdAt = payload.sentAt;
    } else {
      createdAt = new Date().toISOString();
    }

    return {
      id: messageId,
      roomId: payload.roomId,
      senderAccountId: senderAccountId,
      senderType: senderType,
      senderName: senderName,
      messageType: messageType,
      content: content,
      metadata: metadata,
      status: 'ACTIVE',
      createdAt: createdAt
    };
  }
}
