export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  lastMessage: {
    body: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}
