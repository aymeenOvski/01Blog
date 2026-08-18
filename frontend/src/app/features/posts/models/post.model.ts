export interface CommentResponse {
  id?: number;
  username: string;
  userAvatarUrl?: string | null;
  content: string;
  createdAt: string;
}

export interface PostResponse {
  id: number;
  username: string;
  userAvatarUrl?: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  createdAt: string;

  showMenu?: boolean;
  isEditing?: boolean;
  editingContent?: string;

  likesCount?: number;
  isLiked?: boolean;
  commentsCount?: number;
  comments?: CommentResponse[];
  showComments?: boolean;
  newCommentText?: string;
  isSubmittingComment?: boolean;
}
