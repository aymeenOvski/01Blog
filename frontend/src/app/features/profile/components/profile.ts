import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ReportModalComponent } from '../../reports/components/report-modal/report-modal';

import { UserService } from '../services/user.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserProfileResponse, UserSummary } from '../models/user-profile.model';
import { PostService } from '../../posts/services/post.service';
import {
  PostResponse,
  CommentResponse
} from '../../posts/models/post.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ReportModalComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit, OnDestroy {

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private routeSub?: Subscription;
  private postCreatedSub?: Subscription;

  profile: UserProfileResponse | null = null;

  currentUser = this.authService.getUsername();

  posts: PostResponse[] = [];
  postsPage = 0;
  postsLastPage = false;
  postsLoadingMore = false;

  isOwner = false;

  loading = true;
  postsLoading = false;

  errorMessage: string | null = null;
  postsErrorMessage: string | null = null;
  actionError: string | null = null;
  actionSuccess: string | null = null;
  savingPostId: number | null = null;
  savedPostId: number | null = null;

  deleteConfirmPostId: number | null = null;
  deletingPostId: number | null = null;
  deleteConfirmComment: {
    postId: number;
    commentId: number;
  } | null = null;

  deletingCommentId: number | null = null;

  private expandedPostIds = new Set<number>();
  private expandedCommentIds = new Set<number>();

  readonly postPreviewLength = 280;
  readonly commentPreviewLength = 160;

  private actionErrorTimeout?: ReturnType<typeof setTimeout>;

  showReportModal = false;
  showProfileMenu = false;

  reportTargetPostId: number | null = null;

  repostingPostIds = new Set<number>();

  activeModalTab: 'followers' | 'following' | null = null;

  userListLoading = false;
  userListLoadingMore = false;
  userListPage = 0;
  userListLastPage = false;
  userList: UserSummary[] = [];

  ngOnInit(): void {
    this.postCreatedSub = this.postService.postCreated$.subscribe(post => {
      if (this.profile?.username === post.username) {
        post.actionFeedback = 'Post published successfully.';
        post.actionFeedbackType = 'success';
        this.posts = [
          post,
          ...this.posts
        ];
        this.showPostFeedback(post, 'Post published successfully.');
      }
    });

    this.routeSub = this.route.paramMap.subscribe(params => {
      const username = params.get('username');

      // A profile route must always have a username.
      // Never silently fall back to the logged-in user's profile.
      if (!username || !username.trim()) {
        this.router.navigate(['/404'], { replaceUrl: true });
        return;
      }

      this.loadProfile(username);
    });
  }

  loadProfile(username: string): void {
    const normalizedUsername = username.trim();

    this.profile = null;
    this.posts = [];
    this.expandedPostIds.clear();
    this.expandedCommentIds.clear();
    this.postsPage = 0;
    this.postsLastPage = false;
    this.isOwner = false;

    this.loading = true;
    this.postsLoading = true;

    this.errorMessage = null;
    this.postsErrorMessage = null;
    this.actionError = null;

    this.showProfileMenu = false;
    this.showReportModal = false;
    this.reportTargetPostId = null;

    this.deleteConfirmComment = null;
    this.deletingCommentId = null;

    this.activeModalTab = null;
    this.userList = [];

    // First load the requested user's profile.
    // Only request their posts if the profile actually exists.
    this.userService.getUserProfile(normalizedUsername).subscribe({

      next: (data) => {
        this.profile = data;
        this.isOwner = this.currentUser === data.username;
        this.loading = false;

        this.postService.getUserPosts(normalizedUsername).subscribe({

          next: (response) => {
            this.posts = response.content.map(post => ({
              ...post,
              showMenu: false,
              isEditing: false,
              editingContent: ''
            }));
            this.postsPage = response.number + 1;
            this.postsLastPage = response.last;

            this.postsLoading = false;
          },

          error: (err) => {
            this.posts = [];
            this.postsLoading = false;

            // If the user has become unavailable between the two requests,
            // treat the whole profile as unavailable.
            if (err.status === 404) {
              this.profile = null;
              this.router.navigate(['/404'], {
                replaceUrl: true,
                queryParams: { errorMessage: err.error?.message || 'Resource not found' }
              });
              return;
            }

            this.postsErrorMessage =
              err.error?.message || 'Failed to load posts';
          }
        });
      },

      error: (err) => {
        this.profile = null;
        this.posts = [];
        this.isOwner = false;

        this.loading = false;
        this.postsLoading = false;

        if (err.status === 404) {
          this.router.navigate(['/404'], {
            replaceUrl: true,
            queryParams: { errorMessage: err.error?.message || 'Resource not found' }
          });
          return;
        }

        this.errorMessage =
          err.error?.message || 'Failed to load user profile';
      }
    });
  }

  loadMorePosts(): void {
    if (!this.profile || this.postsLoadingMore || this.postsLastPage) {
      return;
    }

    this.postsLoadingMore = true;
    this.postService.getUserPosts(this.profile.username, this.postsPage).subscribe({
      next: response => {
        this.posts = [
          ...this.posts,
          ...response.content.map(post => ({
            ...post,
            showMenu: false,
            isEditing: false,
            editingContent: ''
          }))
        ];
        this.postsPage = response.number + 1;
        this.postsLastPage = response.last;
        this.postsLoadingMore = false;
      },
      error: error => {
        this.postsLoadingMore = false;
        this.postsErrorMessage = error.error?.message || 'Failed to load more posts';
      }
    });
  }

  shouldShowPostExpansion(post: PostResponse): boolean {
    return !!post.content &&
      post.content.length > this.postPreviewLength;
  }

  isPostExpanded(post: PostResponse): boolean {
    return this.expandedPostIds.has(post.id);
  }

  togglePostExpansion(post: PostResponse): void {
    if (this.expandedPostIds.has(post.id)) {
      this.expandedPostIds.delete(post.id);
    } else {
      this.expandedPostIds.add(post.id);
    }
  }

  shouldShowCommentExpansion(comment: CommentResponse): boolean {
    return comment.content.length > this.commentPreviewLength;
  }

  isCommentExpanded(comment: CommentResponse): boolean {
    return this.expandedCommentIds.has(comment.id);
  }

  toggleCommentExpansion(comment: CommentResponse): void {
    if (this.expandedCommentIds.has(comment.id)) {
      this.expandedCommentIds.delete(comment.id);
    } else {
      this.expandedCommentIds.add(comment.id);
    }
  }

  private showPostFeedback(post: PostResponse, message: string): void {
    if (post.actionFeedbackTimeout) {
      clearTimeout(post.actionFeedbackTimeout);
    }

    post.actionFeedback = message;
    post.actionFeedbackType = 'success';
    post.actionFeedbackTimeout = setTimeout(() => {
      post.actionFeedback = undefined;
      post.actionFeedbackTimeout = undefined;
    }, 3000);
  }

  @HostListener('window:scroll')
  onPostsScroll(): void {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;

    if (nearBottom && !this.postsLoading && !this.postsLoadingMore && !this.postsLastPage) {
      this.loadMorePosts();
    }
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
  }

  toggleFollow(): void {
    if (!this.profile || this.isOwner) return;

    const originalState = this.profile.isFollowing;

    this.profile.isFollowing = !originalState;

    this.profile.followersCount =
      (this.profile.followersCount || 0) +
      (originalState ? -1 : 1);

    this.userService.toggleFollow(this.profile.username).subscribe({

      next: (isFollowing) => {
        if (this.profile && isFollowing !== this.profile.isFollowing) {
          this.profile.followersCount =
            (this.profile.followersCount || 0) +
            (isFollowing ? 1 : -1);

          this.profile.isFollowing = isFollowing;
        }
      },

      error: () => {
        if (!this.profile) return;

        this.profile.isFollowing = originalState;

        this.profile.followersCount =
          (this.profile.followersCount || 0) +
          (originalState ? 1 : -1);
      }
    });
  }

  openUserListModal(tab: 'followers' | 'following'): void {
    if (!this.profile) return;

    this.activeModalTab = tab;
    this.userListLoading = true;
    this.userListLoadingMore = false;
    this.userListPage = 0;
    this.userListLastPage = false;
    this.userList = [];

    const request =
      tab === 'followers'
        ? this.userService.getFollowers(this.profile.username, 0)
        : this.userService.getFollowing(this.profile.username, 0);

    request.subscribe({

      next: (response) => {
        this.userList = response.content;
        this.userListPage = response.number + 1;
        this.userListLastPage = response.last;
        this.userListLoading = false;
      },

      error: () => {
        this.userList = [];
        this.userListLoading = false;
      }
    });
  }

  closeUserListModal(): void {
    this.activeModalTab = null;
    this.userList = [];
  }

  loadMoreUsers(): void {
    if (!this.profile || !this.activeModalTab || this.userListLoadingMore || this.userListLastPage) {
      return;
    }

    this.userListLoadingMore = true;
    const request = this.activeModalTab === 'followers'
      ? this.userService.getFollowers(this.profile.username, this.userListPage)
      : this.userService.getFollowing(this.profile.username, this.userListPage);

    request.subscribe({
      next: response => {
        this.userList = [...this.userList, ...response.content];
        this.userListPage = response.number + 1;
        this.userListLastPage = response.last;
        this.userListLoadingMore = false;
      },
      error: () => {
        this.userListLoadingMore = false;
      }
    });
  }

  onUserListScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 40) {
      this.loadMoreUsers();
    }
  }

  toggleLike(post: PostResponse): void {
    if (post.isSubmittingLike) return;

    post.isSubmittingLike = true;

    const originalState = post.isLiked ?? false;
    const currentCount = post.likesCount ?? 0;

    post.isLiked = !originalState;

    post.likesCount = Math.max(
      0,
      currentCount + (originalState ? -1 : 1)
    );

    this.postService.toggleLike(post.id).subscribe({

      next: (isLiked) => {
        post.isLiked = isLiked;
        post.isSubmittingLike = false;
      },

      error: () => {
        post.isLiked = originalState;
        post.likesCount = currentCount;
        post.isSubmittingLike = false;
      }
    });
  }

  toggleComments(post: PostResponse): void {
    post.showComments = !post.showComments;

    if (post.showComments && !post.comments) {
      this.loadComments(post);
    }
  }

  loadComments(post: PostResponse): void {
    if (post.commentsLoading || post.commentsLastPage) {
      return;
    }

    const page = post.commentsPage ?? 0;
    post.commentsLoading = true;
    this.postService.getComments(post.id, page).subscribe({
      next: response => {
        post.comments = [...(post.comments ?? []), ...response.content];
        post.commentsPage = response.number + 1;
        post.commentsLastPage = response.last;
        post.commentsLoading = false;
      },
      error: error => {
        post.commentsLoading = false;
        console.error('Failed to load comments', error);
      }
    });
  }

  onCommentsScroll(event: Event, post: PostResponse): void {
    const element = event.target as HTMLElement;
    const nearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 40;

    if (nearBottom) {
      this.loadComments(post);
    }
  }

  addComment(post: PostResponse): void {
    if (
      !post.newCommentText ||
      !post.newCommentText.trim() ||
      post.isSubmittingComment
    ) {
      return;
    }

    const commentText = post.newCommentText.trim();

    post.isSubmittingComment = true;

    this.postService.addComment(post.id, { content: commentText }).subscribe({

      next: (newComment) => {
        if (!post.comments) {
          post.comments = [];
        }

        post.comments = [newComment, ...(post.comments ?? [])];
        this.showPostFeedback(post, 'Comment posted successfully.');
        post.commentsCount = (post.commentsCount || 0) + 1;

        post.newCommentText = '';
        post.isSubmittingComment = false;
      },

      error: (err) => {
        console.error('Failed to add comment', err);
        post.isSubmittingComment = false;
      }
    });
  }

  onCommentKeyDown(event: Event, post: PostResponse): void {
    const keyboardEvent = event as KeyboardEvent;

    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.addComment(post);
    }
  }

  resolveMediaUrl(mediaUrl: string | null): string {
    if (!mediaUrl) return '';

    if (
      mediaUrl.startsWith('http://') ||
      mediaUrl.startsWith('https://') ||
      mediaUrl.startsWith('blob:') ||
      mediaUrl.startsWith('data:')
    ) {
      return mediaUrl;
    }

    return mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;
  }

  isVideoUrl(url: string): boolean {
    const lower = url.toLowerCase();

    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.includes('/video/')
    );
  }

  togglePostMenu(post: PostResponse, event: Event): void {
    event.stopPropagation();

    this.showProfileMenu = false;

    this.posts.forEach(p => {
      if (p !== post) {
        p.showMenu = false;
      }
    });

    post.showMenu = !post.showMenu;
  }

  editPost(post: PostResponse): void {
    post.showMenu = false;
    post.isEditing = true;
    post.editingContent = post.content;
  }

  cancelEdit(post: PostResponse): void {
    post.isEditing = false;
    post.editingContent = '';
  }

  saveEdit(post: PostResponse): void {
    if (!post.editingContent || !post.editingContent.trim()) {
      return;
    }

    const updatedText = post.editingContent.trim();

    this.savingPostId = post.id;
    this.savedPostId = null;
    this.actionError = null;

    this.postService.updatePost(post.id, {
      content: updatedText
    }).subscribe({

      next: (updatedPost) => {
        post.content = updatedPost.content;
        post.isEditing = false;

        this.savingPostId = null;
        this.savedPostId = post.id;

        setTimeout(() => {
          if (this.savedPostId === post.id) {
            this.savedPostId = null;
          }
        }, 2000);
      },

      error: (err) => {
        this.savingPostId = null;

        this.actionError =
          err.error?.message || 'Failed to update post';
      }
    });
  }

  deletePost(post: PostResponse): void {
    post.showMenu = false;
    this.deleteConfirmPostId = post.id;
  }

  cancelDelete(): void {
    this.deleteConfirmPostId = null;
  }

  confirmDeletePost(post: PostResponse): void {
    if (this.deletingPostId === post.id) {
      return;
    }

    this.deletingPostId = post.id;
    this.actionError = null;

    this.postService.deletePost(post.id).subscribe({

      next: () => {
        this.posts = this.posts.filter(
          p => p.id !== post.id
        );

        this.deleteConfirmPostId = null;
        this.deletingPostId = null;
      },

      error: err => {
        this.deletingPostId = null;

        this.actionError =
          err.error?.message ||
          'Failed to delete post';
      }

    });
  }

  confirmDelete(): void {
    if (this.deleteConfirmPostId === null) {
      return;
    }

    const post = this.posts.find(
      p => p.id === this.deleteConfirmPostId
    );

    if (!post) {
      this.deleteConfirmPostId = null;
      return;
    }

    this.confirmDeletePost(post);
  }

  askDeleteComment(post: PostResponse, comment: CommentResponse): void {

    if (this.deletingCommentId !== null) {
      return;
    }

    this.deleteConfirmComment = {
      postId: post.id,
      commentId: comment.id
    };
  }

  cancelDeleteComment(): void {
    if (this.deletingCommentId !== null) {
      return;
    }

    this.deleteConfirmComment = null;
  }

  confirmDeleteComment(): void {
    if (!this.deleteConfirmComment || this.deletingCommentId !== null) {
      return;
    }

    const { postId, commentId } = this.deleteConfirmComment;

    console.log('CONFIRM DELETE COMMENT', postId, commentId);

    this.deletingCommentId = commentId;

    this.postService.deleteComment(postId, commentId).subscribe({
      next: () => {
        const post = this.posts.find(p => p.id === postId);

        if (post) {
          post.comments = (post.comments ?? []).filter(
            comment => comment.id !== commentId
          );

          post.commentsCount = Math.max(
            0,
            (post.commentsCount ?? 0) - 1
          );

          this.showPostFeedback(
            post,
            'Comment deleted successfully.'
          );
        }

        this.deletingCommentId = null;
        this.deleteConfirmComment = null;
      },

      error: (error) => {
        console.error('Failed to delete comment', error);

        this.deletingCommentId = null;
        this.deleteConfirmComment = null;

        this.actionError =
          error?.error?.message || 'Failed to delete comment';
      }
    });
  }

  repost(post: PostResponse): void {
    post.showMenu = false;

    if (this.repostingPostIds.has(post.id)) {
      return;
    }

    if (post.repost) {
      this.actionError = 'You already reposted this post.';

      if (this.actionErrorTimeout) {
        clearTimeout(this.actionErrorTimeout);
      }

      this.actionErrorTimeout = setTimeout(
        () => (this.actionError = null),
        3000
      );

      return;
    }

    this.repostingPostIds.add(post.id);
    this.actionError = null;

    this.postService.repost(post.id).subscribe({

      next: () => {
        this.repostingPostIds.delete(post.id);

        this.showPostFeedback(post, `Reposted ${post.username}'s post.`);

        if (this.actionErrorTimeout) {
          clearTimeout(this.actionErrorTimeout);
        }

        this.actionErrorTimeout = setTimeout(
          () => (this.actionError = null),
          3000
        );
      },

      error: (error) => {
        this.repostingPostIds.delete(post.id);

        this.actionError =
          error?.error?.message ||
          'Unable to repost this post.';

        if (this.actionErrorTimeout) {
          clearTimeout(this.actionErrorTimeout);
        }

        this.actionErrorTimeout = setTimeout(
          () => (this.actionError = null),
          3000
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.postCreatedSub?.unsubscribe();

    if (this.actionErrorTimeout) {
      clearTimeout(this.actionErrorTimeout);
    }
  }

  openReportModal(): void {
    if (!this.profile || this.isOwner) {
      return;
    }

    this.showProfileMenu = false;
    this.showReportModal = true;
    this.reportTargetPostId = null;
  }

  openReportPostModal(post: PostResponse): void {
    post.showMenu = false;

    if (post.username === this.currentUser) {
      return;
    }

    this.showProfileMenu = false;
    this.showReportModal = true;
    this.reportTargetPostId = post.id;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportTargetPostId = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    const isInsideMenu =
      !!target?.closest(
        '.post-options-dropdown, .profile-options-dropdown'
      );

    if (!isInsideMenu) {
      this.posts.forEach(p => (p.showMenu = false));
      this.showProfileMenu = false;
    }
  }
}