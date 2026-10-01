import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../auth/services/auth.service';
import { PostService } from '../posts/services/post.service';
import { UserService } from '../profile/services/user.service';
import { UserSummary } from '../profile/models/user-profile.model';
import { PostResponse } from '../posts/models/post.model';
import { ReportModalComponent } from '../reports/components/report-modal/report-modal';

export interface DashboardMediaPreview {
  file: File;
  url: string;
  type: 'image' | 'video';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ReportModalComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private router = inject(Router);
  private postService = inject(PostService);
  private userService = inject(UserService);
  private ngZone = inject(NgZone);

  @ViewChild('mediaInput') mediaInput?: ElementRef<HTMLInputElement>;

  readonly maxContentLength = 2000;
  readonly maxMediaFiles = 5;
  readonly maxFileSizeBytes = 5 * 1024 * 1024;

  showReportModal = false;
  reportTargetPostId: number | null = null;
  reportTargetUsername: string | null = null;

  username: string;

  content = '';
  mediaPreviews: DashboardMediaPreview[] = [];

  isSubmitting = false;
  errorMessage: string | null = null;
  private postCreatedSub?: Subscription;

  suggestedUsers: UserSummary[] = [];
  isLoadingSuggested = true;
  suggestedError: string | null = null;
  followPending = new Set<string>();

  suggestedActionError: string | null = null;
  feedActionError: string | null = null;
  feedActionSuccess: string | null = null;

  private suggestedActionErrorTimeout?: ReturnType<typeof setTimeout>;
  private feedActionErrorTimeout?: ReturnType<typeof setTimeout>;
  private feedActionSuccessTimeout?: ReturnType<typeof setTimeout>;

  repostingPostIds = new Set<number>();

  feedPosts: PostResponse[] = [];
  isLoadingFeed = true;
  isLoadingMoreFeed = false;
  feedError: string | null = null;
  feedLastPage = false;

  mobilePanel: 'suggested' | 'settings' | null = null;

  constructor() {
    this.username = this.authService.getUsername() || 'User';
  }

  ngOnInit(): void {
    this.postCreatedSub = this.postService.postCreated$.subscribe(post => {
      this.feedPosts = [post, ...this.feedPosts];
      this.showPostFeedback(post, 'Post published successfully.');
    });

    this.loadSuggested();
    this.loadFeed();
  }

  ngOnDestroy(): void {
    this.postCreatedSub?.unsubscribe();

    if (this.suggestedActionErrorTimeout) {
      clearTimeout(this.suggestedActionErrorTimeout);
    }

    if (this.feedActionErrorTimeout) {
      clearTimeout(this.feedActionErrorTimeout);
    }

    if (this.feedActionSuccessTimeout) {
      clearTimeout(this.feedActionSuccessTimeout);
    }
  }

  get contentLength(): number {
    return this.content ? this.content.length : 0;
  }

  get isNearLimit(): boolean {
    return this.contentLength > this.maxContentLength * 0.9;
  }

  get isOverLimit(): boolean {
    return this.contentLength > this.maxContentLength;
  }

  get isValidPost(): boolean {
    const hasText =
      !!this.content &&
      this.content.trim().length > 0 &&
      !this.isOverLimit;

    const hasMedia = this.mediaPreviews.length > 0;

    return (hasText || hasMedia) && !this.isSubmitting;
  }

  loadSuggested(): void {
    this.isLoadingSuggested = true;
    this.suggestedError = null;

    this.userService.getSuggestedUsers().subscribe({
      next: (users) => {
        this.suggestedUsers = users;
        this.isLoadingSuggested = false;
      },

      error: () => {
        this.suggestedError =
          'Could not load suggestions right now.';
        this.isLoadingSuggested = false;
      }
    });
  }

  isFollowPending(username: string): boolean {
    return this.followPending.has(username);
  }

  loadFeed(page = 0): void {
    this.isLoadingFeed = page === 0;
    this.isLoadingMoreFeed = page > 0;
    this.feedError = null;

    this.postService.getFeed(page).subscribe({
      next: (response) => {
        const posts = response.content.map(post => ({
          ...post,
          showMenu: false
        }));

        this.feedPosts = page === 0 ? posts : [...this.feedPosts, ...posts];
        this.feedLastPage = response.last;

        this.isLoadingFeed = false;
        this.isLoadingMoreFeed = false;
      },

      error: () => {
        this.feedError =
          'Could not load your feed right now.';
        this.isLoadingFeed = false;
        this.isLoadingMoreFeed = false;
      }
    });
  }

  loadMoreFeed(): void {
    if (!this.isLoadingMoreFeed && !this.feedLastPage) {
      this.loadFeed(Math.floor(this.feedPosts.length / 10));
    }
  }

  @HostListener('window:scroll')
  onFeedScroll(): void {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;

    if (nearBottom && !this.isLoadingFeed && !this.isLoadingMoreFeed && !this.feedLastPage) {
      this.loadMoreFeed();
    }
  }

  trackByUsername(index: number, user: UserSummary): string {
    return user.username;
  }

  trackByPostId(index: number, post: PostResponse): number {
    return post.id;
  }

  toggleMobilePanel(
    panel: 'suggested' | 'settings'
  ): void {
    this.mobilePanel =
      this.mobilePanel === panel ? null : panel;
  }

  followSuggested(user: UserSummary): void {
    if (this.isFollowPending(user.username)) {
      return;
    }

    this.followPending.add(user.username);
    this.clearSuggestedActionError();

    this.userService.toggleFollow(user.username).subscribe({
      next: (isFollowing) => {
        this.followPending.delete(user.username);

        if (isFollowing) {
          // Successfully followed:
          // remove the user from the suggestions immediately.
          this.suggestedUsers = this.suggestedUsers.filter(
            u => u.username !== user.username
          );
        }
      },

      error: () => {
        this.followPending.delete(user.username);

        this.suggestedActionError =
          `Could not follow @${user.username}. Please try again.`;

        this.showSuggestedActionError();
      }
    });
  }

  private clearSuggestedActionError(): void {
    this.suggestedActionError = null;

    if (this.suggestedActionErrorTimeout) {
      clearTimeout(this.suggestedActionErrorTimeout);
      this.suggestedActionErrorTimeout = undefined;
    }
  }

  private showSuggestedActionError(): void {
    if (this.suggestedActionErrorTimeout) {
      clearTimeout(this.suggestedActionErrorTimeout);
    }

    this.suggestedActionErrorTimeout = setTimeout(() => {
      this.suggestedActionError = null;
      this.suggestedActionErrorTimeout = undefined;
    }, 3000);
  }

  private clearFeedActionError(): void {
    this.feedActionError = null;

    if (this.feedActionErrorTimeout) {
      clearTimeout(this.feedActionErrorTimeout);
      this.feedActionErrorTimeout = undefined;
    }
  }

  private showFeedActionSuccess(message: string): void {
    this.feedActionSuccess = message;

    if (this.feedActionSuccessTimeout) {
      clearTimeout(this.feedActionSuccessTimeout);
    }

    this.feedActionSuccessTimeout = setTimeout(() => {
      this.feedActionSuccess = null;
      this.feedActionSuccessTimeout = undefined;
    }, 3000);
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

  private showFeedActionError(): void {
    if (this.feedActionErrorTimeout) {
      clearTimeout(this.feedActionErrorTimeout);
    }

    this.feedActionErrorTimeout = setTimeout(() => {
      this.feedActionError = null;
      this.feedActionErrorTimeout = undefined;
    }, 3000);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    if (
      this.mediaPreviews.length + files.length >
      this.maxMediaFiles
    ) {
      this.errorMessage =
        `You can upload a maximum of ${this.maxMediaFiles} media items per post.`;

      input.value = '';
      return;
    }

    for (const file of files) {
      if (file.size > this.maxFileSizeBytes) {
        this.errorMessage =
          `File "${file.name}" exceeds the 5MB limit.`;

        input.value = '';
        return;
      }

      const mediaType: 'image' | 'video' =
        file.type.startsWith('video/')
          ? 'video'
          : 'image';

      const reader = new FileReader();

      reader.onload = () => {
        this.ngZone.run(() => {
          this.mediaPreviews.push({
            file,
            url: reader.result as string,
            type: mediaType
          });
        });
      };

      reader.readAsDataURL(file);
    }

    this.errorMessage = null;
    input.value = '';
  }

  removeMedia(index: number): void {
    this.mediaPreviews.splice(index, 1);
  }

  triggerFileSelect(): void {
    this.mediaInput?.nativeElement.click();
  }

  onSubmit(): void {
    if (!this.isValidPost) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const filesToUpload =
      this.mediaPreviews.map(p => p.file);

    this.postService
      .createPost(this.content.trim(), filesToUpload)
      .subscribe({

        next: () => {
          this.isSubmitting = false;
          this.content = '';
          this.mediaPreviews = [];
        },

        error: (err) => {
          this.isSubmitting = false;

          this.errorMessage =
            err.error?.message ||
            'Failed to publish post.';
        }
      });
  }

  resolveMediaUrl(mediaUrl: string | null): string {
    if (!mediaUrl) {
      return '';
    }

    if (
      mediaUrl.startsWith('http://') ||
      mediaUrl.startsWith('https://')
    ) {
      return mediaUrl;
    }

    return mediaUrl.startsWith('/')
      ? mediaUrl
      : `/${mediaUrl}`;
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

  togglePostMenu(
    post: PostResponse,
    event: Event
  ): void {
    event.stopPropagation();

    this.feedPosts.forEach(p => {
      if (p !== post) {
        p.showMenu = false;
      }
    });

    post.showMenu = !post.showMenu;
  }

  repost(post: PostResponse): void {
    if (this.repostingPostIds.has(post.id)) {
      return;
    }

    // A repost should still be visible in the menu,
    // but attempting it gives the user clear feedback.
    if (post.repost) {
      post.showMenu = false;

      this.feedActionError =
        'You already reposted this post.';

      this.showFeedActionError();
      return;
    }

    post.showMenu = false;

    this.repostingPostIds.add(post.id);
    this.clearFeedActionError();

    this.postService.repost(post.id).subscribe({

      next: () => {
        this.repostingPostIds.delete(post.id);
        this.showPostFeedback(post, `Reposted ${post.username}'s post.`);
      },

      error: (error) => {
        this.repostingPostIds.delete(post.id);

        this.feedActionError =
          error?.error?.message ||
          'Unable to repost this post.';

        this.showFeedActionError();
      }
    });
  }

  toggleLike(post: PostResponse): void {
    if (post.isSubmittingLike) {
      return;
    }

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

    const commentText =
      post.newCommentText.trim();

    post.isSubmittingComment = true;

    this.postService
      .addComment(post.id, {
        content: commentText
      })
      .subscribe({

        next: (newComment) => {
          if (!post.comments) {
            post.comments = [];
          }

          post.comments = [newComment, ...(post.comments ?? [])];
          this.showPostFeedback(post, 'Comment posted successfully.');

          post.commentsCount =
            (post.commentsCount || 0) + 1;

          post.newCommentText = '';
          post.isSubmittingComment = false;
        },

        error: (err) => {
          console.error(
            'Failed to add comment',
            err
          );

          post.isSubmittingComment = false;
        }
      });
  }

  onCommentKeyDown(
    event: Event,
    post: PostResponse
  ): void {
    const keyboardEvent =
      event as KeyboardEvent;

    if (
      keyboardEvent.key === 'Enter' &&
      !keyboardEvent.shiftKey
    ) {
      keyboardEvent.preventDefault();
      this.addComment(post);
    }
  }

  openReportModal(
    post: PostResponse
  ): void {
    post.showMenu = false;

    if (post.username === this.username) {
      return;
    }

    this.reportTargetPostId = post.id;
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportTargetPostId = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target =
      event.target as HTMLElement | null;

    const isInsideMenu =
      !!target?.closest(
        '.post-options-dropdown'
      );

    if (!isInsideMenu) {
      this.feedPosts.forEach(
        p => (p.showMenu = false)
      );
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
