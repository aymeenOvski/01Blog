import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-post-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post-modal.html',
  styleUrl: './create-post-modal.css'
})
export class CreatePostModalComponent {
  @Output() close = new EventEmitter<void>();

  content = '';
  selectedFile: File | null = null;
  mediaPreviewUrl: string | null = null;
  mediaType: 'image' | 'video' | null = null;

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
        console.log('Media preview URL: %s', this.mediaPreviewUrl);
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
    if (!this.content.trim() && !this.selectedFile) return;

    // TODO: Connect with PostService once backend endpoint is ready
    console.log('Submitting post base:', {
      content: this.content,
      media: this.selectedFile
    });

    this.onClose();
  }
}
