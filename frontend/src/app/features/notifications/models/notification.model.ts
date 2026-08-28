export interface NotificationResponse {
  id: number;
  actorUsername: string;
  actorAvatarUrl?: string;
  type: 'FOLLOW' | 'POST';
  message: string;
  targetId?: number;
  isRead: boolean;
  createdAt: string;
}
