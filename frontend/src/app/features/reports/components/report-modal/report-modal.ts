import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  ReportService
} from './../../services/report.service';

import {
  ReportReason,
  ReportRequest
} from '../../models/report.model';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-modal.html',
  styleUrl: './report-modal.css'
})
export class ReportModalComponent {

  @Input() username: string | null = null;

  @Input() postId: number | null = null;

  @Output() closed = new EventEmitter<void>();

  selectedReason: ReportReason | '' = '';

  description = '';

  isSubmitting = false;

  success = false;

  errorMessage = '';

  readonly maxDescriptionLength = 1000;

  readonly reportReasons: { value: ReportReason; label: string }[] = [
    { value: 'SPAM', label: 'Spam' },
    { value: 'HARASSMENT', label: 'Harassment or bullying' },
    { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
    { value: 'HATE_SPEECH', label: 'Hate speech' },
    { value: 'FAKE_ACCOUNT', label: 'Fake or impersonation account' },
    { value: 'OTHER', label: 'Other' }
  ];

  constructor(private reportService: ReportService) { }

  get isPostReport(): boolean {
    return this.postId !== null;
  }

  get isValid(): boolean {
    return (
      this.selectedReason !== '' &&
      this.description.length <= this.maxDescriptionLength &&
      !this.isSubmitting
    );
  }

  get descriptionLength(): number {
    return this.description.length;
  }

  submit(): void {
    if (!this.isValid || this.selectedReason === '') {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const request: ReportRequest = this.isPostReport
      ? {
        targetPostId: this.postId,
        reason: this.selectedReason,
        description: this.description.trim() || null
      }
      : {
        targetUsername: this.username,
        reason: this.selectedReason,
        description: this.description.trim() || null
      };

    this.reportService.submitReport(request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.success = true;
      },

      error: (error) => {
        this.isSubmitting = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to submit the report. Please try again.';
      }
    });
  }

  close(): void {
    if (this.isSubmitting) {
      return;
    }

    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}