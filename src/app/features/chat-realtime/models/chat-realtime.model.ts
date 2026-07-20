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

export interface ChatMessagePayload {
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

export interface RealtimeEnvelope<T> {
  eventId?: string;
  type?: string;
  eventType?: string;
  data?: T;
  payload?: T;
  occurredAt?: string;
}
