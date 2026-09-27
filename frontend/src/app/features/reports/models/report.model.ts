export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'INAPPROPRIATE_CONTENT'
  | 'HATE_SPEECH'
  | 'FAKE_ACCOUNT'
  | 'OTHER';

export interface ReportRequest {
  targetPostId?: number | null;
  targetUsername?: string | null;
  reason: ReportReason;
  description?: string | null;
}

export interface ReportResponse {
  id: number;
  type: 'USER' | 'POST';
  targetUserId: number | null;
  targetPostId: number | null;
  reporterUsername: string;
  targetUsername: string;
  reason: ReportReason;
  description: string | null;
  status: string;
  createdAt: string;
}