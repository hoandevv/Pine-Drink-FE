import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
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
  assignedStaffAccountId?: string | null;
  assignedStaffName?: string | null;
  branchId?: string | null;
  orderId?: string | null;
  title?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  status: string;
  createdAt?: string | null;
}

export interface ChatMessageResponse {
  id: string;
  roomId: string;
  senderAccountId: string;
  senderName?: string | null;
  messageType: string;
  content?: string | null;
  metadata?: string | null;
  status: string;
  createdAt: string;
}

export interface SendChatMessageRequest {
  roomId: string;
  messageType: string;
  content: string;
  metadata?: string | null;
}

interface RealtimeEnvelope<T> {
  eventId?: string;
  type?: string;
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
  private userSubscription?: StompSubscription;
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly messagesSubject = new Subject<ChatMessageResponse>();
  private readonly errorsSubject = new Subject<string>();

  connected$ = this.connectedSubject.asObservable();
  messages$ = this.messagesSubject.asObservable();
  errors$ = this.errorsSubject.asObservable();

  constructor(private readonly http: HttpClient, private readonly tokenService: TokenService) {}

  getRooms(page = 0, size = 20): Observable<BaseResponse<PageResponse<ChatRoomResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<BaseResponse<PageResponse<ChatRoomResponse>>>(this.apiUrl, { params });
  }

  getMessages(roomId: string, page = 0, size = 30): Observable<BaseResponse<PageResponse<ChatMessageResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<BaseResponse<PageResponse<ChatMessageResponse>>>(`${this.apiUrl}/${roomId}/messages`, { params });
  }

  connect(roomId?: string): void {
    const token = this.tokenService.getAccessToken();
    if (!token) {
      this.errorsSubject.next('Missing access token. Login trước bro.');
      return;
    }

    if (this.client?.active) {
      if (roomId) {
        this.subscribeRoom(roomId);
      }
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connectedSubject.next(true);
        this.subscribeUserQueue();
        if (roomId) {
          this.subscribeRoom(roomId);
        }
      },
      onStompError: (frame) => {
        this.errorsSubject.next(frame.headers['message'] || 'STOMP error');
      },
      onWebSocketClose: () => this.connectedSubject.next(false),
      onWebSocketError: () => this.errorsSubject.next('WebSocket connection error')
    });

    this.client.activate();
  }

  subscribeRoom(roomId: string): void {
    if (!this.client?.connected) {
      this.connect(roomId);
      return;
    }

    this.roomSubscription?.unsubscribe();
    this.roomSubscription = this.client.subscribe(`/topic/chat/rooms/${roomId}`, (message) => this.handleMessage(message));
  }

  sendMessage(request: SendChatMessageRequest): void {
    if (!this.client?.connected) {
      this.errorsSubject.next('Realtime chưa connect. Đợi vài giây rồi gửi lại bro.');
      return;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(request)
    });
  }

  disconnect(): void {
    this.roomSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.client?.deactivate();
    this.connectedSubject.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private subscribeUserQueue(): void {
    this.userSubscription?.unsubscribe();
    this.userSubscription = this.client?.subscribe('/user/queue/chat', (message) => this.handleMessage(message));
  }

  private handleMessage(message: IMessage): void {
    try {
      const parsed = JSON.parse(message.body) as ChatMessageResponse | RealtimeEnvelope<ChatMessageResponse>;
      const payload = this.unwrapMessage(parsed);
      if (payload?.roomId) {
        this.messagesSubject.next(payload);
      }
    } catch {
      this.errorsSubject.next('Không parse được realtime message');
    }
  }

  private unwrapMessage(parsed: ChatMessageResponse | RealtimeEnvelope<ChatMessageResponse>): ChatMessageResponse | undefined {
    if ('roomId' in parsed) {
      return parsed;
    }
    return parsed.data || parsed.payload;
  }
}
