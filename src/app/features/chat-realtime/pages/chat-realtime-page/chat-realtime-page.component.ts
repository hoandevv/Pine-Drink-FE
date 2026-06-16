import { Component, OnDestroy, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatMessageResponse, ChatRealtimeService, ChatRoomResponse } from 'src/app/core/services/chat-realtime.service';
import { TokenService } from 'src/app/core/services/token.service';
import { Branch } from 'src/app/features/branches/models/branch.model';
import { BranchService } from 'src/app/features/branches/services/branch.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AccessControlService } from 'src/app/core/services/access-control.service';

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
  showRoomCreator = false;

  loadingRooms = false;
  loadingMessages = false;
  creatingRoom = false;
  connected = false;
  errorMessage = '';
  currentUserId?: string;
  currentUserBranchIds: string[] = [];
  isSystemScope = false;
  branches: Branch[] = [];
  loadingBranches = false;
  currentUserRoles: string[] = [];

  // Mobile navigation states
  showMobileSidebar = true;
  showMobileInfo = false;

  clientSuggestions = [
    { label: '🍹 Menu hôm nay', text: 'Chào Pine Drink, cho mình xin menu hôm nay với ạ!' },
    { label: '🚚 Giao hàng', text: 'Phí ship đến khu vực của mình là bao nhiêu vậy shop?' },
    { label: '⭐ Khuyến mãi', text: 'Hiện tại chi nhánh mình có chương trình ưu đãi nào không ạ?' },
    { label: '📝 Đơn hàng', text: 'Mình muốn kiểm tra trạng thái đơn hàng vừa đặt.' }
  ];

  private shouldScrollToBottom = false;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly chatRealtime: ChatRealtimeService,
    private readonly tokenService: TokenService,
    private readonly branchService: BranchService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly accessControl: AccessControlService
  ) { }

  ngOnInit(): void {
    const currentUser = this.tokenService.getCurrentUserFromToken();
    const requestedBranchId = this.route.snapshot.queryParamMap.get('branchId') || sessionStorage.getItem('selectedBranchId') || '';

    this.currentUserId = currentUser?.id;
    this.currentUserRoles = currentUser?.roles || [];
    this.currentUserBranchIds = currentUser?.scope?.branchIds || [];
    this.isSystemScope = currentUser?.scope?.type === 'SYSTEM';
    this.branchId = this.isClientChat
      ? requestedBranchId
      : (this.isSystemScope ? requestedBranchId : this.currentUserBranchIds[0] || '');

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
          filtered = filtered.filter(r => r.status !== 'CLOSED');
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
    if (!this.isClientChat && !branchFilter) {
      this.rooms = [];
      this.loadingRooms = false;
      return;
    }

    this.loadingRooms = true;
    this.errorMessage = '';

    const roomsRequest = this.isClientChat
      ? this.chatRealtime.getMyRooms()
      : this.chatRealtime.getStaffRooms(branchFilter);

    roomsRequest.subscribe({
      next: (response) => {
        this.rooms = response.data?.content || [];
        this.loadingRooms = false;

        // Auto select room if branchId is present (e.g. from FAB)
        if (this.branchId && this.rooms.length > 0) {
          const targetRoom = this.rooms.find(r => r.branchId === this.branchId);
          if (targetRoom && !this.activeRoom) {
            this.selectRoom(targetRoom);
          }
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
    if (this.isClientChat && branchFilter) {
      sessionStorage.setItem('selectedBranchId', branchFilter);
      sessionStorage.setItem('selectedBranchName', this.getBranchLabel(branchFilter));
    }
    if (branchFilter) {
      this.chatRealtime.subscribeBranch(branchFilter);
    }
    this.activeRoom = undefined;
    this.messages = [];
    this.loadRooms();
  }

  toggleMobileSidebar(): void {
    this.showMobileSidebar = !this.showMobileSidebar;
    if (this.showMobileSidebar) this.showMobileInfo = false;
  }

  toggleMobileInfo(): void {
    this.showMobileInfo = !this.showMobileInfo;
    if (this.showMobileInfo) this.showMobileSidebar = false;
  }

  openSelectedBranchChat(): void {
    if (!this.branchId || this.creatingRoom) return;
    const existingRoom = this.rooms.find((room) => room.branchId === this.branchId) || this.rooms[0];
    if (existingRoom) {
      this.selectRoom(existingRoom);
      return;
    }
    this.createRoom();
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

    // Reset unread count locally for immediate feedback
    if (room.unreadCount && room.unreadCount > 0) {
      room.unreadCount = 0;
      this.markAsRead(room.id);
    }

    this.chatRealtime.getRoom(room.id).subscribe({
      next: (response) => {
        const freshRoom = response.data || room;
        this.activeRoom = freshRoom;

        // Ensure fresh data also has reset unread count
        this.activeRoom.unreadCount = 0;

        this.upsertRoom(this.activeRoom);
        this.messages = [];
        this.loadMessages(freshRoom.id);
        this.chatRealtime.subscribeRoom(freshRoom.id);
        this.showMobileSidebar = false;
      },
      error: () => {
        this.activeRoom = room;
        this.messages = [];
        this.loadMessages(room.id);
        this.chatRealtime.subscribeRoom(room.id);
        this.showMobileSidebar = false;
      }
    });
  }

  private markAsRead(roomId: string): void {
    // TODO: Implement backend API call: this.chatRealtime.markAsRead(roomId).subscribe(...)
    console.log(`Marking room ${roomId} as read`);
  }

  selectSuggestion(text: string): void {
    if (!this.branchId) {
      this.errorMessage = 'Vui lòng chọn chi nhánh trước khi đặt câu hỏi bro.';
      return;
    }
    this.messageContent = text;
    if (!this.activeRoom) {
      this.openSelectedBranchChat();
    }
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
    } catch (err) { }
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
    const isNowActive = room.id === this.activeRoom?.id;
    const finalRoom = isNowActive ? { ...room, unreadCount: 0 } : room;

    const exists = this.rooms.some((item) => item.id === room.id);
    if (exists) {
      this.rooms = this.rooms.map((item) => (item.id === room.id ? { ...item, ...finalRoom } : item));
    } else {
      this.rooms = [finalRoom, ...this.rooms];
    }

    // Always sort by latest message/activity
    this.rooms.sort((a, b) => this.toTime(b.lastMessageAt || b.createdAt) - this.toTime(a.lastMessageAt || a.createdAt));
  }

  private bumpRoomPreview(message: ChatMessageResponse): void {
    const isNowActive = message.roomId === this.activeRoom?.id;

    this.rooms = this.rooms.map((room) => {
      if (room.id === message.roomId) {
        return {
          ...room,
          lastMessagePreview: message.content || '[Tin nhắn]',
          lastMessageAt: message.createdAt,
          unreadCount: isNowActive ? 0 : (room.unreadCount || 0) + 1
        };
      }
      return room;
    });

    // Sort: Newest message at top
    this.rooms.sort((a, b) => this.toTime(b.lastMessageAt || b.createdAt) - this.toTime(a.lastMessageAt || a.createdAt));
  }

  private loadBranches(): void {
    this.loadingBranches = true;
    this.branchService.getActiveBranches(0, 200).subscribe({
      next: (response) => {
        const allowed = new Set(this.currentUserBranchIds);
        this.branches = (this.isSystemScope || this.isClientChat)
          ? response.content
          : response.content.filter((branch) => allowed.has(branch.id));

        if (!this.branchId && this.branches.length) {
          this.branchId = this.branches[0].id;
          this.chatRealtime.subscribeBranch(this.branchId);
        }

        if (this.isClientChat && this.branchId) {
          sessionStorage.setItem('selectedBranchId', this.branchId);
          sessionStorage.setItem('selectedBranchName', this.getBranchLabel(this.branchId));
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
    return this.isClientChat ? 'Hỗ trợ khách hàng' : (this.isSystemScope ? 'Hỗ trợ khách hàng' : `Hỗ trợ tại ${this.getBranchLabel(this.branchId || this.currentUserBranchIds[0])}`.trim());
  }

  getBranchLabel(branchId?: string | null): string {
    const branch = this.branches.find((item) => item.id === branchId);
    if (!branch) {
      return branchId ? `Chi nhánh ${branchId}` : '';
    }
    return branch.name;
  }

  getRoomAvatarUrl(room?: ChatRoomResponse | null): string {
    return room?.customerAvatarUrl || room?.avatarUrl || '';
  }

  hasRoomAvatar(room?: ChatRoomResponse | null): boolean {
    return !!this.getRoomAvatarUrl(room);
  }

  get isStaffChat(): boolean {
    return this.accessControl.isAdminConsoleUser() || this.currentUserRoles
      .map((role) => role.toUpperCase().replace(/^ROLE_/, ''))
      .some((role) => ['ADMIN', 'MANAGER', 'DELIVERY', 'STAFF'].includes(role));
  }

  get isClientChat(): boolean {
    return this.router.url.startsWith('/chat') && !this.isStaffChat;
  }

  getConversationTitle(room: ChatRoomResponse): string {
    return this.getRoomName(room);
  }

  getRoomDisplayName(room: ChatRoomResponse): string {
    return this.getBranchLabel(room.branchId || this.branchId);
  }

  getRoomListTitle(room: ChatRoomResponse): string {
    return this.isClientChat ? this.getRoomDisplayName(room) : this.getRoomName(room);
  }

  getRoomName(room: ChatRoomResponse): string {
    return room.customerName || room.title || room.roomCode || 'Khách Pine Drink';
  }

  getRoomInitial(room: ChatRoomResponse): string {
    return this.getRoomName(room).trim().charAt(0) || 'P';
  }

  getSenderType(message: ChatMessageResponse): string {
    return message.senderType || (this.isMine(message) ? 'STAFF' : 'CUSTOMER');
  }

  getSenderLabel(message: ChatMessageResponse): string {
    const type = this.getSenderType(message);
    if (message.senderName) return message.senderName;
    if (type === 'CUSTOMER') return 'Khách';
    if (type === 'ADMIN') return 'Admin';
    if (type === 'SYSTEM') return 'System';
    if (type === 'BOT') return 'Bot';
    return 'Staff';
  }
}
