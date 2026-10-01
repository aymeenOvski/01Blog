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
import { PostResponse } from '../../posts/models/post.model';

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

  profile: UserProfileResponse | null = null;

  currentUser = this.authService.getUsername();

  posts: PostResponse[] = [];

  isOwner = false;

  loading = true;
  postsLoading = false;

  errorMessage: string | null = null;
  postsErrorMessage: string | null = null;
  actionError: string | null = null;
  savingPostId: number | null = null;
  savedPostId: number | null = null;

  private actionErrorTimeout?: ReturnType<typeof setTimeout>;

  showReportModal = false;
  showProfileMenu = false;

  reportTargetPostId: number | null = null;

  repostingPostIds = new Set<number>();

  activeModalTab: 'followers' | 'following' | null = null;

  userListLoading = false;
  userList: UserSummary[] = [];

  ngOnInit(): void {
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
    this.isOwner = false;

    this.loading = true;
    this.postsLoading = true;

    this.errorMessage = null;
    this.postsErrorMessage = null;
    this.actionError = null;

    this.showProfileMenu = false;
    this.showReportModal = false;
    this.reportTargetPostId = null;

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

          next: (posts) => {
            this.posts = posts.map(post => ({
              ...post,
              showMenu: false,
              isEditing: false,
              editingContent: ''
            }));

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
    this.userList = [];

    const request =
      tab === 'followers'
        ? this.userService.getFollowers(this.profile.username)
        : this.userService.getFollowing(this.profile.username);

    request.subscribe({

      next: (users) => {
        this.userList = users;
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
      post.comments = [];

      this.postService.getComments(post.id).subscribe({

        next: (comments) => {
          post.comments = comments;
        },

        error: (err) => {
          console.error('Failed to load comments', err);
        }
      });
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

        post.comments.push(newComment);
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

    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    const originalPosts = [...this.posts];

    this.posts = this.posts.filter(p => p.id !== post.id);

    this.postService.deletePost(post.id).subscribe({

      error: (err) => {
        this.posts = originalPosts;

        this.actionError =
          err.error?.message || 'Failed to delete post';
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

        this.actionError =
          `Reposted ${post.username}'s post.`;

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