import { CommonModule } from '@angular/common';
import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { PostService } from '../posts/services/post.service';
import { UserService } from '../profile/services/user.service';
import { UserSummary } from '../profile/models/user-profile.model';

export interface DashboardMediaPreview {
  file: File;
  url: string;
  type: 'image' | 'video';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  username: string;

  content = '';
  mediaPreviews: DashboardMediaPreview[] = [];
  isSubmitting = false;
  errorMessage: string | null = null;
  postSuccess = false;
  private successTimeout?: ReturnType<typeof setTimeout>;

  suggestedUsers: UserSummary[] = [];
  isLoadingSuggested = true;
  suggestedError: string | null = null;
  followPending = new Set<string>();
  actionError: string | null = null;
  private actionErrorTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.username = this.authService.getUsername() || 'User';
  }

  get avatarUrl(): string | null {
    return this.authService.currentUser().avatarUrl;
  }

  ngOnInit(): void {
    this.loadSuggested();
  }

  ngOnDestroy(): void {
    if (this.successTimeout) clearTimeout(this.successTimeout);
    if (this.actionErrorTimeout) clearTimeout(this.actionErrorTimeout);
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
    const hasText = !!this.content && this.content.trim().length > 0 && !this.isOverLimit;
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
        this.suggestedError = 'Could not load suggestions right now.';
        this.isLoadingSuggested = false;
      }
    });
  }

  isFollowPending(username: string): boolean {
    return this.followPending.has(username);
  }

  trackByUsername(index: number, user: UserSummary): string {
    return user.username;
  }

  followSuggested(user: UserSummary): void {
    if (this.isFollowPending(user.username)) return;

    this.followPending.add(user.username);
    this.actionError = null;

    this.userService.toggleFollow(user.username).subscribe({
      next: () => {
        this.suggestedUsers = this.suggestedUsers.filter(u => u.username !== user.username);
        this.followPending.delete(user.username);
      },
      error: () => {
        this.followPending.delete(user.username);
        this.actionError = `Could not follow @${user.username}. Please try again.`;
        if (this.actionErrorTimeout) clearTimeout(this.actionErrorTimeout);
        this.actionErrorTimeout = setTimeout(() => (this.actionError = null), 3000);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);

    if (this.mediaPreviews.length + files.length > this.maxMediaFiles) {
      this.errorMessage = `You can upload a maximum of ${this.maxMediaFiles} media items per post.`;
      input.value = '';
      return;
    }

    for (const file of files) {
      if (file.size > this.maxFileSizeBytes) {
        this.errorMessage = `File "${file.name}" exceeds the 5MB limit.`;
        input.value = '';
        return;
      }

      const mediaType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
      const reader = new FileReader();

      reader.onload = () => {
        this.ngZone.run(() => {
          this.mediaPreviews.push({ file, url: reader.result as string, type: mediaType });
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
    if (!this.isValidPost) return;

    this.isSubmitting = true;
    this.errorMessage = null;

    const filesToUpload = this.mediaPreviews.map(p => p.file);

    this.postService.createPost(this.content.trim(), filesToUpload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.content = '';
        this.mediaPreviews = [];
        this.postSuccess = true;
        if (this.successTimeout) clearTimeout(this.successTimeout);
        this.successTimeout = setTimeout(() => (this.postSuccess = false), 3000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to publish post.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
