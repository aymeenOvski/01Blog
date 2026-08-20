import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-create-post-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post-modal.html',
  styleUrl: './create-post-modal.css'
})
export class CreatePostModalComponent {
  @Output() close = new EventEmitter<void>();
  private postService = inject(PostService);

  content = '';
  selectedFile: File | null = null;
  mediaPreviewUrl: string | null = null;
  mediaType: 'image' | 'video' | null = null;
  isSubmitting = false;
  errorMessage: string | null = null;

  get wordCount(): number {
    if (!this.content || !this.content.trim()) return 0;
    return this.content.trim().split(/\s+/).length;
  }

  get isValidPost(): boolean {
    const hasText = !!this.content && this.content.trim().length > 0 && this.content.length <= 2000;
    const hasMedia = !!this.selectedFile;
    return (hasText || hasMedia) && (this.content ? this.content.length <= 2000 : true) && !this.isSubmitting;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = file;
      const maxSizeBytes = 5 * 1024 * 1024;

      if (file.size > maxSizeBytes) {
        this.errorMessage = 'File size exceeds the 5MB limit.';
        this.removeMedia();
        return;
      }

      if (file.type.startsWith('image/')) {
        this.mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
        this.mediaType = 'video';
      } else {
        this.mediaType = null;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.mediaPreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeMedia(): void {
    this.selectedFile = null;
    this.mediaPreviewUrl = null;
    this.mediaType = null;

    const fileInput = document.getElementById('media-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onClose(): void {
    this.removeMedia();
    this.content = '';
    this.close.emit();
  }

  onSubmit(): void {
    if ((!this.content.trim() && !this.selectedFile) || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.postService.createPost(this.content.trim(), this.selectedFile).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.onClose();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to publish post.';
      }
    });
  }
}
