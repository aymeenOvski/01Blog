import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReportService } from './../../services/report.service';

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

  reason = '';
  isSubmitting = false;
  success = false;
  errorMessage = '';

  readonly maxReasonLength = 1000;

  constructor(private reportService: ReportService) {}

  get isPostReport(): boolean {
    return this.postId !== null;
  }

  get isValid(): boolean {
    return this.reason.trim().length > 0
      && this.reason.length <= this.maxReasonLength
      && !this.isSubmitting;
  }

  get reasonLength(): number {
    return this.reason.length;
  }

  submit(): void {
    if (!this.isValid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const request = this.isPostReport
      ? {
          targetPostId: this.postId,
          reason: this.reason.trim()
        }
      : {
          targetUsername: this.username,
          reason: this.reason.trim()
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