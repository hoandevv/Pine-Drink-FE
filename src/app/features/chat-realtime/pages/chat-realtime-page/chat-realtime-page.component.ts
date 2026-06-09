import { Component, OnDestroy, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatMessageResponse, ChatRealtimeService, ChatRoomResponse } from 'src/app/core/services/chat-realtime.service';
import { TokenService } from 'src/app/core/services/token.service';
import { Branch } from 'src/app/features/branches/models/branch.model';
import { BranchService } from 'src/app/features/branches/services/branch.service';

@Component({
  selector: 'app-chat-realtime-page',
  templateUrl: './chat-realtime-page.component.html',
  styleUrls: ['./chat-realtime-page.component.scss']
})
export class ChatRealtimePageComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageList') private messageListContainer?: ElementRef;

  rooms: ChatRoomResponse[] = [];
  messages: ChatMessageResponse[] = [];
  activeRoom?: ChatRoomResponse;
  messageContent = '';
  branchId = '';
  orderId = '';
  searchText = '';
  selectedFilter: 'all' | 'unread' | 'processing' | 'closed' = 'all';
  
  loadingRooms = false;
  loadingMessages = false;
  assigningRoom = false;
  creatingRoom = false;
  connected = false;
  errorMessage = '';
  currentUserId?: string;
  currentUserBranchIds: string[] = [];
  isSystemScope = false;
  branches: Branch[] = [];
  loadingBranches = false;

  private shouldScrollToBottom = false;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly chatRealtime: ChatRealtimeService,
    private readonly tokenService: TokenService,
    private readonly branchService: BranchService
  ) {}

  ngOnInit(): void {
    const currentUser = this.tokenService.getCurrentUserFromToken();
    this.currentUserId = currentUser?.id;
    this.currentUserBranchIds = currentUser?.scope?.branchIds || [];
    this.isSystemScope = currentUser?.scope?.type === 'SYSTEM';
    this.branchId = this.isSystemScope ? '' : this.currentUserBranchIds[0] || '';

    this.bindRealtime();
    this.loadBranches();
    this.chatRealtime.connect(undefined, this.branchId || undefined);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  get filteredRooms(): ChatRoomResponse[] {
    let filtered = this.rooms;

    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      filtered = filtered.filter(r => 
        (r.customerName?.toLowerCase().includes(q)) || 
        (r.roomCode?.toLowerCase().includes(q)) ||
        (r.orderId?.toLowerCase().includes(q)) ||
        (r.title?.toLowerCase().includes(q))
      );
    }

    if (this.selectedFilter !== 'all') {
      switch (this.selectedFilter) {
        case 'unread':
          filtered = filtered.filter(r => (r.unreadCount || 0) > 0);
          break;
        case 'processing':
          filtered = filtered.filter(r => !!r.assignedStaffAccountId);
          break;
        case 'closed':
          filtered = filtered.filter(r => r.status === 'CLOSED');
          break;
      }
    }

    return filtered;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.chatRealtime.disconnect();
  }

  loadRooms(): void {
    if (this.loadingRooms) return;

    const branchFilter = this.branchId.trim() || undefined;
    if (!branchFilter) {
      this.rooms = [];
      this.loadingRooms = false;
      return;
    }

    this.loadingRooms = true;
    this.errorMessage = '';

    this.chatRealtime.getStaffRooms(branchFilter).subscribe({
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

  onBranchChanged(): void {
    const branchFilter = this.branchId.trim();
    if (branchFilter) {
      this.chatRealtime.subscribeBranch(branchFilter);
    }
    this.activeRoom = undefined;
    this.messages = [];
    this.loadRooms();
  }

  createRoom(): void {
    const branchId = this.branchId.trim() || undefined;
    const orderId = this.orderId.trim() || undefined;
    const title = this.buildRoomTitle(orderId);

    if (!branchId) {
      this.errorMessage = 'Chọn chi nhánh cần nhắn tin trước đã';
      return;
    }

    this.creatingRoom = true;
    this.errorMessage = '';
    this.chatRealtime.createRoom({ branchId, orderId, title }).subscribe({
      next: (response) => {
        const room = response.data;
        this.creatingRoom = false;
        if (room) {
          this.upsertRoom(room);
          this.selectRoom(room);
        }
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Không tạo được phòng chat';
        this.creatingRoom = false;
      }
    });
  }

  selectRoom(room: ChatRoomResponse): void {
    this.errorMessage = '';
    this.chatRealtime.getRoom(room.id).subscribe({
      next: (response) => {
        const freshRoom = response.data || room;
        this.activeRoom = freshRoom;
        this.upsertRoom(freshRoom);
        this.messages = [];
        this.loadMessages(freshRoom.id);
        this.chatRealtime.subscribeRoom(freshRoom.id);
      },
      error: () => {
        this.activeRoom = room;
        this.messages = [];
        this.loadMessages(room.id);
        this.chatRealtime.subscribeRoom(room.id);
      }
    });
  }

  assignActiveRoom(): void {
    const roomId = this.activeRoom?.id;
    if (!roomId) return;

    this.assigningRoom = true;
    this.errorMessage = '';
    this.chatRealtime.assignRoom(roomId).subscribe({
      next: (response) => {
        this.assigningRoom = false;
        if (response.data) {
          this.activeRoom = response.data;
          this.upsertRoom(response.data);
        }
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Không nhận được phòng chat';
        this.assigningRoom = false;
      }
    });
  }

  sendMessage(): void {
    const content = this.messageContent.trim();
    const roomId = this.activeRoom?.id;
    if (!content || !roomId) return;

    this.chatRealtime.sendMessage({ roomId, messageType: 'TEXT', content, metadata: null });
    this.messageContent = '';
    this.shouldScrollToBottom = true;
  }

  isMine(message: ChatMessageResponse): boolean {
    return !!this.currentUserId && message.senderAccountId === this.currentUserId;
  }

  canAssignActiveRoom(): boolean {
    return !!this.activeRoom && this.activeRoom.assignedStaffAccountId !== this.currentUserId;
  }

  trackByRoom(_: number, room: ChatRoomResponse): string {
    return room.id;
  }

  trackByMessage(_: number, message: ChatMessageResponse): string {
    return message.id || `${message.roomId}-${message.createdAt}-${message.content}`;
  }

  private scrollToBottom(): void {
    try {
      if (this.messageListContainer) {
        const el = this.messageListContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {}
  }

  private bindRealtime(): void {
    this.subscriptions.add(this.chatRealtime.connected$.subscribe((connected) => (this.connected = connected)));
    this.subscriptions.add(this.chatRealtime.errors$.subscribe((message) => (this.errorMessage = message)));
    this.subscriptions.add(this.chatRealtime.rooms$.subscribe((room) => this.upsertRoom(room)));
    this.subscriptions.add(
      this.chatRealtime.messages$.subscribe((message) => {
        if (message.roomId !== this.activeRoom?.id) {
          this.bumpRoomPreview(message);
          return;
        }
        const exists = this.messages.some((item) => item.id === message.id);
        if (!exists) {
          this.messages = [...this.messages, message].sort((a, b) => this.toTime(a.createdAt) - this.toTime(b.createdAt));
          this.shouldScrollToBottom = true;
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
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Không tải được tin nhắn';
        this.loadingMessages = false;
      }
    });
  }

  private upsertRoom(room: ChatRoomResponse): void {
    const exists = this.rooms.some((item) => item.id === room.id);
    this.rooms = exists
      ? this.rooms.map((item) => (item.id === room.id ? { ...item, ...room } : item))
      : [room, ...this.rooms];
    this.rooms = [...this.rooms].sort((a, b) => this.toTime(b.lastMessageAt || b.createdAt) - this.toTime(a.lastMessageAt || a.createdAt));
  }

  private bumpRoomPreview(message: ChatMessageResponse): void {
    this.rooms = this.rooms.map((room) =>
      room.id === message.roomId
        ? { ...room, lastMessagePreview: message.content || '[message]', lastMessageAt: message.createdAt }
        : room
    );
    this.rooms = [...this.rooms].sort((a, b) => this.toTime(b.lastMessageAt || b.createdAt) - this.toTime(a.lastMessageAt || a.createdAt));
  }

  private loadBranches(): void {
    this.loadingBranches = true;
    this.branchService.getActiveBranches(0, 200).subscribe({
      next: (response) => {
        const allowed = new Set(this.currentUserBranchIds);
        this.branches = this.isSystemScope
          ? response.content
          : response.content.filter((branch) => allowed.has(branch.id));

        if (!this.branchId && this.branches.length) {
          this.branchId = this.branches[0].id;
          this.chatRealtime.subscribeBranch(this.branchId);
        }

        this.loadingBranches = false;
        this.loadRooms();
      },
      error: () => {
        this.loadingBranches = false;
      }
    });
  }

  private toTime(value?: string | null): number {
    return value ? new Date(value).getTime() : 0;
  }

  private buildRoomTitle(orderId?: string): string {
    if (orderId) return `Hỗ trợ đơn hàng #${orderId}`;
    return this.isSystemScope ? 'Hỗ trợ khách hàng' : `Hỗ trợ tại ${this.getBranchLabel(this.branchId || this.currentUserBranchIds[0])}`.trim();
  }

  getBranchLabel(branchId?: string): string {
    const branch = this.branches.find((item) => item.id === branchId);
    if (!branch) {
      return branchId ? `Chi nhánh ${branchId}` : '';
    }
    return branch.code ? `${branch.name} · ${branch.code}` : branch.name;
  }
}
