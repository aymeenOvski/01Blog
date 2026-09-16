export interface AdminStats {
  totalUsers: number;
  bannedUsers: number;
  totalPosts: number;
  hiddenPosts: number;
  pendingReports: number;
}

export type ReportStatus =
  | 'PENDING'
  | 'RESOLVED'
  | 'DISMISSED';

export interface AdminReport {
  id: number;
  type: 'USER' | 'POST';
  targetUserId: number | null;
  targetPostId: number | null;
  reporterUsername: string;
  targetUsername: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export type UserStatus = 'ACTIVE' | 'BANNED';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
}

export type PostVisibility = 'VISIBLE' | 'HIDDEN';

export interface AdminPost {
  id: number;
  username: string;
  content: string;
  visibility: PostVisibility;
  createdAt: string;
}