import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';


import { UserService } from '../services/user.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserProfileResponse, UserSummary } from '../models/user-profile.model';
import { PostService } from '../../posts/services/post.service';
import { PostResponse, CommentResponse } from '../../posts/models/post.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private route = inject(ActivatedRoute);

  private routeSub?: Subscription;

  profile: UserProfileResponse | null = null;
  currentUser = this.authService.getUsername();
  posts: PostResponse[] = [];
  isOwner = false;
  loading = true;
  postsLoading = false;
  errorMessage: string | null = null;
  postsErrorMessage: string | null = null;

  activeModalTab: 'followers' | 'following' | null = null;
  userListLoading = false;
  userList: UserSummary[] = [];

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const username = params.get('username') || this.currentUser;
      if (username) {
        this.loadProfile(username);
      }
    });
  }

  loadProfile(username: string): void {
    this.loading = true;
    this.postsLoading = true;
    this.postsErrorMessage = null;

    const normalizedUsername = username.trim();

    this.userService.getUserProfile(username).subscribe({
      next: (data) => {
        this.profile = data;
        this.isOwner = this.currentUser === data.username;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load user profile';
        this.loading = false;
      }
    });

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
        this.postsErrorMessage = err.error?.message || 'Failed to load posts';
        this.postsLoading = false;
      }
    });
  }

  toggleFollow(): void {
    if (!this.profile || this.isOwner) return;

    const originalState = this.profile.isFollowing;
    this.profile.isFollowing = !originalState;
    this.profile.followersCount = (this.profile.followersCount || 0) + (originalState ? -1 : 1);

    this.userService.toggleFollow(this.profile.username).subscribe({
      next: (isFollowing) => {
        this.profile!.isFollowing = isFollowing;
        this.profile!.followersCount = (this.profile!.followersCount || 0) + (isFollowing ? 1 : -1);
      },
      error: () => {
        this.profile!.isFollowing = originalState;
        this.profile!.followersCount = (this.profile!.followersCount || 0) + (originalState ? 1 : -1);
      }
    });
  }

  openUserListModal(tab: 'followers' | 'following'): void {
    if (!this.profile) return;
    this.activeModalTab = tab;
    this.userListLoading = true;
    this.userList = [];

    const request = tab === 'followers'
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

  /* Optimistic Like Handler */
  toggleLike(post: PostResponse): void {
    if (post.isSubmittingLike) return; 
    post.isSubmittingLike = true;

    const originalState = post.isLiked ?? false;
    const currentCount = post.likesCount ?? 0;

    post.isLiked = !originalState;
    post.likesCount = Math.max(0, currentCount + (originalState ? -1 : 1));

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

  /* Collapsible Comments Toggle */
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

  /* Optimistic Comment Submission */
  addComment(post: PostResponse): void {
    if (!post.newCommentText || !post.newCommentText.trim() || post.isSubmittingComment) return;

    const commentText = post.newCommentText.trim();
    post.isSubmittingComment = true;

    this.postService.addComment(post.id, { content: commentText }).subscribe({
      next: (newComment) => {
        if (!post.comments) post.comments = [];
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

    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      return mediaUrl;
    }

    return mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;
  }

  isVideoUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.includes('/video/');
  }

  togglePostMenu(post: PostResponse, event: Event): void {
    event.stopPropagation();
    // Close any other active options menus
    this.posts.forEach(p => {
      if (p !== post) p.showMenu = false;
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
    if (!post.editingContent || !post.editingContent.trim()) return;

    const updatedText = post.editingContent.trim();

    this.postService.updatePost(post.id, { content: updatedText }).subscribe({
      next: (updatedPost) => {
        post.content = updatedPost.content;
        post.isEditing = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update post');
      }
    });
  }

  deletePost(post: PostResponse): void {
    post.showMenu = false;
    if (confirm('Are you sure you want to delete this post?')) {
      const originalPosts = [...this.posts];
      
      this.posts = this.posts.filter(p => p.id !== post.id);

      this.postService.deletePost(post.id).subscribe({
        error: (err) => {
          this.posts = originalPosts;
          alert(err.error?.message || 'Failed to delete post');
        }
      });
    }
  }

  repost(post: PostResponse): void {
    post.showMenu = false;
    alert(`Reposted "${post.username}"'s post!`);

    // TODO: Connect to postService.repost(...) API later
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    const isMenuButton = (event.target as HTMLElement).closest('.post-options-dropdown');

    if (!isMenuButton) {
      this.posts.forEach(p => p.showMenu = false);
    }
  }


}
