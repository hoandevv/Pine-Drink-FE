import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatMessageResponse, ChatRealtimeService, ChatRoomResponse } from 'src/app/core/services/chat-realtime.service';
import { TokenService } from 'src/app/core/services/token.service';

@Component({
  selector: 'app-chat-realtime-page',
  templateUrl: './chat-realtime-page.component.html',
  styleUrls: ['./chat-realtime-page.component.scss']
})
export class ChatRealtimePageComponent implements OnInit, OnDestroy {
  rooms: ChatRoomResponse[] = [];
  messages: ChatMessageResponse[] = [];
  activeRoom?: ChatRoomResponse;
  messageContent = '';
  loadingRooms = false;
  loadingMessages = false;
  connected = false;
  errorMessage = '';
  currentUserId?: string;

  private readonly subscriptions = new Subscription();

  constructor(private readonly chatRealtime: ChatRealtimeService, private readonly tokenService: TokenService) {}

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getCurrentUserFromToken()?.id;
    this.bindRealtime();
    this.chatRealtime.connect();
    this.loadRooms();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.chatRealtime.disconnect();
  }

  loadRooms(): void {
    this.loadingRooms = true;
    this.errorMessage = '';
    this.chatRealtime.getRooms().subscribe({
      next: (response) => {
        this.rooms = response.data?.content || [];
        this.loadingRooms = false;
        if (!this.activeRoom && this.rooms.length) {
          this.selectRoom(this.rooms[0]);
        }
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Không tải được danh sách phòng chat';
        this.loadingRooms = false;
      }
    });
  }

  selectRoom(room: ChatRoomResponse): void {
    this.activeRoom = room;
    this.messages = [];
    this.loadMessages(room.id);
    this.chatRealtime.subscribeRoom(room.id);
  }

  sendMessage(): void {
    const content = this.messageContent.trim();
    const roomId = this.activeRoom?.id;
    if (!content || !roomId) {
      return;
    }

    this.chatRealtime.sendMessage({ roomId, messageType: 'TEXT', content });
    this.messageContent = '';
  }

  isMine(message: ChatMessageResponse): boolean {
    return !!this.currentUserId && message.senderAccountId === this.currentUserId;
  }

  trackByRoom(_: number, room: ChatRoomResponse): string {
    return room.id;
  }

  trackByMessage(_: number, message: ChatMessageResponse): string {
    return message.id || `${message.roomId}-${message.createdAt}-${message.content}`;
  }

  private bindRealtime(): void {
    this.subscriptions.add(this.chatRealtime.connected$.subscribe((connected) => (this.connected = connected)));
    this.subscriptions.add(this.chatRealtime.errors$.subscribe((message) => (this.errorMessage = message)));
    this.subscriptions.add(
      this.chatRealtime.messages$.subscribe((message) => {
        if (message.roomId !== this.activeRoom?.id) {
          this.bumpRoomPreview(message);
          return;
        }
        const exists = this.messages.some((item) => item.id === message.id);
        if (!exists) {
          this.messages = [...this.messages, message].sort((a, b) => this.toTime(a.createdAt) - this.toTime(b.createdAt));
        }
        this.bumpRoomPreview(message);
      })
    );
  }

  private loadMessages(roomId: string): void {
    this.loadingMessages = true;
    this.errorMessage = '';
    this.chatRealtime.getMessages(roomId).subscribe({
      next: (response) => {
        this.messages = (response.data?.content || []).sort((a, b) => this.toTime(a.createdAt) - this.toTime(b.createdAt));
        this.loadingMessages = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Không tải được tin nhắn';
        this.loadingMessages = false;
      }
    });
  }

  private bumpRoomPreview(message: ChatMessageResponse): void {
    this.rooms = this.rooms.map((room) =>
      room.id === message.roomId
        ? { ...room, lastMessagePreview: message.content || '[message]', lastMessageAt: message.createdAt }
        : room
    );
  }

  private toTime(value?: string | null): number {
    return value ? new Date(value).getTime() : 0;
  }
}
