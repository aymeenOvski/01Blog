export interface PostResponse {
  id: number;
  username: string;
  userAvatarUrl: string | null;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
}
