import { Component, EventEmitter, Output, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../services/post.service';

export interface MediaPreview {
  file: File;
  url: string;
  type: 'image' | 'video';
}

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
  private ngZone = inject(NgZone);

  content = '';

  mediaPreviews: MediaPreview[] = [];
  isSubmitting = false;
  errorMessage: string | null = null;

  get wordCount(): number {
    if (!this.content || !this.content.trim()) return 0;
    return this.content.trim().split(/\s+/).length;
  }

  get isValidPost(): boolean {
    const hasText = !!this.content && this.content.trim().length > 0 && this.content.length <= 2000;
    const hasMedia = this.mediaPreviews.length > 0;
    return (hasText || hasMedia) && (this.content ? this.content.length <= 2000 : true) && !this.isSubmitting;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    if (this.mediaPreviews.length + files.length > 5) {
      this.errorMessage = 'You can upload a maximum of 5 media items per post.';
      input.value = '';
      return;
    }

    for (const file of files) {
      if (file.size > maxSizeBytes) {
        this.errorMessage = `File "${file.name}" exceeds the 5MB limit.`;
        input.value = '';
        return;
      }

      const mediaType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
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

  removeMedia(index?: number): void {
    if (index !== undefined) {
      this.mediaPreviews.splice(index, 1);
    } else {
      this.mediaPreviews = [];
    }

    if (this.mediaPreviews.length === 0) {
      const fileInput = document.getElementById('media-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  onClose(): void {
    this.removeMedia();
    this.content = '';
    this.close.emit();
  }

  onSubmit(): void {
    if ((!this.content.trim() && this.mediaPreviews.length === 0) || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const filesToUpload = this.mediaPreviews.map(p => p.file);

    this.postService.createPost(this.content.trim(), filesToUpload).subscribe({
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
