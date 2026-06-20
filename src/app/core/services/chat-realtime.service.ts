import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { PageResponse } from 'src/app/shared/models/page-response.model';
import { TokenService } from './token.service';

export interface ChatRoomResponse {
  id: string;
  roomCode: string;
  roomType: string;
  customerAccountId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAvatarUrl?: string | null;
  avatarUrl?: string | null;
  customerId?: string | null;
  customerAddress?: string | null;
  assignedStaffAccountId?: string | null;
  assignedStaffName?: string | null;
  branchId?: string | null;
  orderId?: string | null;
  title?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  isCustomerOnline?: boolean;
  status: string;
  createdAt?: string | null;
}

export interface ChatMessageResponse {
  id: string;
  roomId: string;
  senderAccountId: string;
  senderType?: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'BOT' | 'SYSTEM' | string | null;
  senderName?: string | null;
  messageType: string;
  content?: string | null;
  metadata?: string | null;
  status: string;
  createdAt: string;
}

export interface CreateChatRoomRequest {
  branchId?: string | null;
  orderId?: string | null;
  title?: string | null;
}

export interface SendChatMessageRequest {
  roomId: string;
  messageType: string;
  content: string;
  metadata?: string | null;
}

export interface ChatRoomRealtimeEvent {
  eventType?: string;
  type?: string;
  room?: ChatRoomResponse;
  message?: ChatMessageResponse;
  data?: ChatRoomResponse | ChatMessageResponse | ChatMessagePayload;
  payload?: ChatRoomResponse | ChatMessageResponse | ChatMessagePayload;
}

interface ChatMessagePayload {
  roomId: string;
  messageId?: string;
  id?: string;
  senderId?: string;
  senderAccountId?: string;
  senderType?: string | null;
  senderName?: string | null;
  messageType?: string;
  content?: string | null;
  metadata?: string | null;
  sentAt?: string;
  createdAt?: string;
}

interface RealtimeEnvelope<T> {
  eventId?: string;
  type?: string;
  eventType?: string;
  data?: T;
  payload?: T;
  occurredAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService implements OnDestroy {
  private readonly apiUrl = `${environment.apiBaseUrl}/chat/rooms`;
  private readonly wsUrl = `${environment.apiBaseUrl.replace('/api/v1', '')}/ws`;
  private client?: Client;
  private roomSubscription?: StompSubscription;
  private branchSubscription?: StompSubscription;
  private userSubscription?: StompSubscription;
  private isActivating = false;
  private pendingRoomId?: string;
  private pendingBranchId?: string;
  private subscribedRoomId?: string;
  private subscribedBranchId?: string;
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
    this.pendingBranchId = branchId || this.pendingBranchId;

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
    this.pendingBranchId = branchId;
    if (!this.client?.connected) {
      this.connect(undefined, branchId);
      return;
    }

    if (this.subscribedBranchId === branchId && this.branchSubscription) {
      return;
    }

    this.branchSubscription?.unsubscribe();
    this.subscribedBranchId = branchId;
    this.branchSubscription = this.client.subscribe(`/topic/branches.${branchId}.chat.rooms`, (message) => this.handleRealtime(message));
  }

  private flushPendingSubscriptions(): void {
    const roomId = this.pendingRoomId;
    const branchId = this.pendingBranchId;

    if (roomId) {
      this.subscribeRoom(roomId);
    }

    if (branchId) {
      this.subscribeBranch(branchId);
    }
  }

  sendMessage(request: SendChatMessageRequest): void {
    if (!this.client?.connected) {
      this.errorsSubject.next('Realtime chưa connect. Đợi vài giây rồi gửi lại bro.');
      return;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ ...request, metadata: request.metadata ?? null })
    });
  }

  disconnect(): void {
    this.roomSubscription?.unsubscribe();
    this.branchSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.roomSubscription = undefined;
    this.branchSubscription = undefined;
    this.userSubscription = undefined;
    this.subscribedRoomId = undefined;
    this.subscribedBranchId = undefined;
    this.pendingRoomId = undefined;
    this.pendingBranchId = undefined;
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
    return {
      id: payload.id || payload.messageId || `${payload.roomId}-${payload.sentAt || Date.now()}`,
      roomId: payload.roomId,
      senderAccountId: payload.senderAccountId || payload.senderId || '',
      senderType: payload.senderType ?? null,
      senderName: payload.senderName ?? null,
      messageType: payload.messageType || 'TEXT',
      content: payload.content ?? null,
      metadata: payload.metadata ?? null,
      status: 'ACTIVE',
      createdAt: payload.createdAt || payload.sentAt || new Date().toISOString()
    };
  }
}
