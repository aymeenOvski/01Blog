import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserService } from '../services/user.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserProfileResponse } from '../models/user-profile.model';
import { PostService } from '../../posts/services/post.service';
import { PostResponse } from '../../posts/models/post.model';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit, OnDestroy {
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
        this.posts = posts;
        this.postsLoading = false;
      },
      error: (err) => {
        this.posts = [];
        this.postsErrorMessage = err.error?.message || 'Failed to load posts';
        this.postsLoading = false;
      }
    });
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

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }
}