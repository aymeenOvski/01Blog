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

interface BaseAdminReport {
  id: number;
  reporterUsername: string;
  targetUsername: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
}

export type AdminReport =
  | (BaseAdminReport & {
    type: 'USER';
    targetUserId: number;
    targetPostId: null;
  })
  | (BaseAdminReport & {
    type: 'POST';
    targetUserId: null;
    targetPostId: number;
  });

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