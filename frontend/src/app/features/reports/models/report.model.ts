export interface ReportRequest {
  targetPostId?: number | null;
  targetUsername?: string | null;
  reason: string;
}

export interface ReportResponse {
  id: number;
  type: 'USER' | 'POST';
  targetUserId: number | null;
  targetPostId: number | null;
  reporterUsername: string;
  targetUsername: string;
  reason: string;
  status: string;
  createdAt: string;
}