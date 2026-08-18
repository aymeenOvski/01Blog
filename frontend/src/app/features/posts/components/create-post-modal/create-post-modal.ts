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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = file;

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
  }

  onClose(): void {
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
