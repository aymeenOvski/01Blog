export interface NotificationResponse {
  id: number;
  actorUsername: string;
  actorAvatarUrl?: string;
  type: 'POST' | 'LIKE' | 'COMMENT' | 'FOLLOW';
  message: string;
  targetId: number | null;
  isRead: boolean;
  createdAt: string;
}
