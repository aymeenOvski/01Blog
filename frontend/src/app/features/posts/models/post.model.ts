export interface CommentResponse {
  id: number;
  username: string;
  content: string;
  createdAt: string;
}

export interface CommentRequest {
  content: string;
}

export interface PostUpdateRequest {
  content: string;
}

export interface PostResponse {
  id: number;
  username: string;
  avatarUrl?: string;
  content: string;
  mediaUrls?: string[];
  createdAt: string;
  
  // UI and State properties
  likesCount?: number;
  isLiked?: boolean;
  isSubmittingLike?: boolean;
  commentsCount?: number;
  comments?: CommentResponse[];
  showComments?: boolean;
  newCommentText?: string;
  isSubmittingComment?: boolean;
  showMenu?: boolean;
  isEditing?: boolean;
  editingContent?: string;
}
