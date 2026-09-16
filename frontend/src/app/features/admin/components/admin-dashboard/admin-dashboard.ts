import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { AdminService } from '../../services/admin.service';
import {
  AdminPost,
  AdminReport,
  AdminStats,
  AdminUser
} from '../../models/admin.model';

type AdminTab =
  | 'overview'
  | 'user-reports'
  | 'post-reports'
  | 'banned-users'
  | 'hidden-posts';

type Confirmation =
  | {
      type: 'delete-user';
      userId: number;
      username: string;
    }
  | {
      type: 'delete-post';
      postId: number;
      username: string;
    };

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {

  private adminService = inject(AdminService);

  stats: AdminStats | null = null;

  reports: AdminReport[] = [];
  bannedUsers: AdminUser[] = [];
  hiddenPosts: AdminPost[] = [];

  activeTab: AdminTab = 'overview';

  isLoadingStats = true;
  isLoadingReports = true;
  isLoadingBannedUsers = false;
  isLoadingHiddenPosts = false;

  statsError: string | null = null;
  reportsError: string | null = null;
  bannedUsersError: string | null = null;
  hiddenPostsError: string | null = null;

  private processingReports = new Set<number>();
  private processingUsers = new Set<number>();
  private processingPosts = new Set<number>();

  private deletingUsers = new Set<number>();
  private deletingPosts = new Set<number>();

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  private toastTimeout?: ReturnType<typeof setTimeout>;

  confirmation: Confirmation | null = null;

  ngOnInit(): void {
    this.loadDashboard();
  }

  // ================================================================
  // DASHBOARD
  // ================================================================

  loadDashboard(): void {
    this.loadStats();
    this.loadReports();
    this.loadBannedUsers();
    this.loadHiddenPosts();
  }

  get isRefreshing(): boolean {
    return (
      this.isLoadingStats ||
      this.isLoadingReports ||
      this.isLoadingBannedUsers ||
      this.isLoadingHiddenPosts
    );
  }

  loadStats(): void {
    this.isLoadingStats = true;
    this.statsError = null;

    this.adminService.getStats().subscribe({
      next: stats => {
        this.stats = stats;
        this.isLoadingStats = false;
      },
      error: error => {
        this.isLoadingStats = false;
        this.statsError =
          error?.error?.message ||
          'Unable to load dashboard statistics.';
      }
    });
  }

  loadReports(): void {
    this.isLoadingReports = true;
    this.reportsError = null;

    this.adminService.getPendingReports().subscribe({
      next: reports => {
        this.reports = reports;
        this.isLoadingReports = false;
      },
      error: error => {
        this.isLoadingReports = false;
        this.reportsError =
          error?.error?.message ||
          'Unable to load pending reports.';
      }
    });
  }

  loadBannedUsers(): void {
    this.isLoadingBannedUsers = true;
    this.bannedUsersError = null;

    this.adminService.getBannedUsers().subscribe({
      next: users => {
        this.bannedUsers = users;
        this.isLoadingBannedUsers = false;
      },
      error: error => {
        this.isLoadingBannedUsers = false;
        this.bannedUsersError =
          error?.error?.message ||
          'Unable to load banned users.';
      }
    });
  }

  loadHiddenPosts(): void {
    this.isLoadingHiddenPosts = true;
    this.hiddenPostsError = null;

    this.adminService.getHiddenPosts().subscribe({
      next: posts => {
        this.hiddenPosts = posts;
        this.isLoadingHiddenPosts = false;
      },
      error: error => {
        this.isLoadingHiddenPosts = false;
        this.hiddenPostsError =
          error?.error?.message ||
          'Unable to load hidden posts.';
      }
    });
  }

  refresh(): void {
    this.loadDashboard();
  }

  // ================================================================
  // TABS
  // ================================================================

  setActiveTab(tab: AdminTab): void {
    this.activeTab = tab;
  }

  // ================================================================
  // REPORT FILTERING
  // ================================================================

  get userReports(): AdminReport[] {
    return this.reports.filter(
      report => report.type === 'USER'
    );
  }

  get postReports(): AdminReport[] {
    return this.reports.filter(
      report => report.type === 'POST'
    );
  }

  get userReportsCount(): number {
    return this.userReports.length;
  }

  get postReportsCount(): number {
    return this.postReports.length;
  }

  get pendingReportsCount(): number {
    return this.stats?.pendingReports ?? this.reports.length;
  }

  get currentResultCount(): number {
    switch (this.activeTab) {
      case 'user-reports':
        return this.userReports.length;

      case 'post-reports':
        return this.postReports.length;

      case 'banned-users':
        return this.bannedUsers.length;

      case 'hidden-posts':
        return this.hiddenPosts.length;

      case 'overview':
      default:
        return this.reports.length;
    }
  }

  get currentResultLabel(): string {
    switch (this.activeTab) {
      case 'banned-users':
        return this.bannedUsers.length === 1
          ? 'banned user'
          : 'banned users';

      case 'hidden-posts':
        return this.hiddenPosts.length === 1
          ? 'hidden post'
          : 'hidden posts';

      default:
        return this.reports.length === 1
          ? 'report'
          : 'reports';
    }
  }

  // ================================================================
  // REPORT ACTIONS
  // ================================================================

  resolveReport(report: AdminReport): void {
    if (this.isProcessingReport(report.id)) {
      return;
    }

    this.processingReports.add(report.id);

    this.adminService
      .updateReport(report.id, 'RESOLVE')
      .subscribe({
        next: () => {
          this.removeReport(report.id);
          this.processingReports.delete(report.id);

          this.showToast(
            'Report resolved successfully.',
            'success'
          );
        },
        error: error => {
          this.processingReports.delete(report.id);

          this.showToast(
            error?.error?.message ||
            'Unable to resolve this report.',
            'error'
          );
        }
      });
  }

  dismissReport(report: AdminReport): void {
    if (this.isProcessingReport(report.id)) {
      return;
    }

    this.processingReports.add(report.id);

    this.adminService
      .updateReport(report.id, 'DISMISS')
      .subscribe({
        next: () => {
          this.removeReport(report.id);
          this.processingReports.delete(report.id);

          this.showToast(
            'Report dismissed.',
            'success'
          );
        },
        error: error => {
          this.processingReports.delete(report.id);

          this.showToast(
            error?.error?.message ||
            'Unable to dismiss this report.',
            'error'
          );
        }
      });
  }

  // ================================================================
  // REPORT → BAN USER
  // ================================================================

  banReportedUser(report: AdminReport): void {
    if (
      report.type !== 'USER' ||
      report.targetUserId === null
    ) {
      return;
    }

    const userId = report.targetUserId;

    if (this.isProcessingUser(userId)) {
      return;
    }

    this.processingUsers.add(userId);

    this.adminService
      .banUser(userId)
      .subscribe({
        next: () => {
          this.processingUsers.delete(userId);

          if (!this.bannedUsers.some(user => user.id === userId)) {
            this.bannedUsers = [
              {
                id: userId,
                username: report.targetUsername,
                email: '',
                role: 'ROLE_USER',
                status: 'BANNED',
                avatarUrl: null,
                createdAt: report.createdAt
              },
              ...this.bannedUsers
            ];
          }

          if (this.stats) {
            this.stats = {
              ...this.stats,
              bannedUsers: this.stats.bannedUsers + 1
            };
          }

          this.showToast(
            `@${report.targetUsername} has been banned.`,
            'success'
          );
        },
        error: error => {
          this.processingUsers.delete(userId);

          this.showToast(
            error?.error?.message ||
            `Unable to ban @${report.targetUsername}.`,
            'error'
          );
        }
      });
  }

  // ================================================================
  // REPORT → HIDE POST
  // ================================================================

  hideReportedPost(report: AdminReport): void {
    if (
      report.type !== 'POST' ||
      report.targetPostId === null
    ) {
      return;
    }

    const postId = report.targetPostId;

    if (this.isProcessingPost(postId)) {
      return;
    }

    this.processingPosts.add(postId);

    this.adminService
      .hidePost(postId)
      .subscribe({
        next: () => {
          this.processingPosts.delete(postId);

          if (!this.hiddenPosts.some(post => post.id === postId)) {
            this.hiddenPosts = [
              {
                id: postId,
                username: report.targetUsername,
                content: '',
                visibility: 'HIDDEN',
                createdAt: report.createdAt
              },
              ...this.hiddenPosts
            ];
          }

          if (this.stats) {
            this.stats = {
              ...this.stats,
              hiddenPosts: this.stats.hiddenPosts + 1
            };
          }

          this.showToast(
            'Post hidden successfully.',
            'success'
          );
        },
        error: error => {
          this.processingPosts.delete(postId);

          this.showToast(
            error?.error?.message ||
            'Unable to hide this post.',
            'error'
          );
        }
      });
  }

  // ================================================================
  // BANNED USERS
  // ================================================================

  unbanUser(user: AdminUser): void {
    if (this.isProcessingUser(user.id)) {
      return;
    }

    this.processingUsers.add(user.id);

    this.adminService
      .unbanUser(user.id)
      .subscribe({
        next: () => {
          this.processingUsers.delete(user.id);

          this.bannedUsers = this.bannedUsers.filter(
            currentUser => currentUser.id !== user.id
          );

          if (this.stats) {
            this.stats = {
              ...this.stats,
              bannedUsers: Math.max(
                0,
                this.stats.bannedUsers - 1
              )
            };
          }

          this.showToast(
            `@${user.username} has been unbanned.`,
            'success'
          );
        },
        error: error => {
          this.processingUsers.delete(user.id);

          this.showToast(
            error?.error?.message ||
            `Unable to unban @${user.username}.`,
            'error'
          );
        }
      });
  }

  // ================================================================
  // HIDDEN POSTS
  // ================================================================

  unhidePost(post: AdminPost): void {
    if (this.isProcessingPost(post.id)) {
      return;
    }

    this.processingPosts.add(post.id);

    this.adminService
      .unhidePost(post.id)
      .subscribe({
        next: () => {
          this.processingPosts.delete(post.id);

          this.hiddenPosts = this.hiddenPosts.filter(
            currentPost => currentPost.id !== post.id
          );

          if (this.stats) {
            this.stats = {
              ...this.stats,
              hiddenPosts: Math.max(
                0,
                this.stats.hiddenPosts - 1
              )
            };
          }

          this.showToast(
            'Post is visible again.',
            'success'
          );
        },
        error: error => {
          this.processingPosts.delete(post.id);

          this.showToast(
            error?.error?.message ||
            'Unable to unhide this post.',
            'error'
          );
        }
      });
  }

  // ================================================================
  // CONFIRMATION
  // ================================================================

  askDeleteReportedUser(report: AdminReport): void {
    if (
      report.type !== 'USER' ||
      report.targetUserId === null
    ) {
      return;
    }

    this.confirmation = {
      type: 'delete-user',
      userId: report.targetUserId,
      username: report.targetUsername
    };
  }

  askDeleteReportedPost(report: AdminReport): void {
    if (
      report.type !== 'POST' ||
      report.targetPostId === null
    ) {
      return;
    }

    this.confirmation = {
      type: 'delete-post',
      postId: report.targetPostId,
      username: report.targetUsername
    };
  }

  askDeleteBannedUser(user: AdminUser): void {
    this.confirmation = {
      type: 'delete-user',
      userId: user.id,
      username: user.username
    };
  }

  askDeleteHiddenPost(post: AdminPost): void {
    this.confirmation = {
      type: 'delete-post',
      postId: post.id,
      username: post.username
    };
  }

  closeConfirmation(): void {
    this.confirmation = null;
  }

  confirmAction(): void {
    if (!this.confirmation) {
      return;
    }

    const confirmation = this.confirmation;

    if (confirmation.type === 'delete-user') {
      this.deleteUser(
        confirmation.userId,
        confirmation.username
      );
      return;
    }

    this.deletePost(
      confirmation.postId,
      confirmation.username
    );
  }

  // ================================================================
  // DELETE USER
  // ================================================================

  private deleteUser(
    userId: number,
    username: string
  ): void {

    if (this.isDeletingUser(userId)) {
      return;
    }

    this.deletingUsers.add(userId);
    this.confirmation = null;

    this.adminService
      .deleteUser(userId)
      .subscribe({
        next: () => {
          const deletedReportsCount =
            this.reports.filter(
              report => report.targetUserId === userId
            ).length;

          const wasBanned =
            this.bannedUsers.some(
              user => user.id === userId
            );

          this.reports = this.reports.filter(
            report => report.targetUserId !== userId
          );

          this.bannedUsers = this.bannedUsers.filter(
            user => user.id !== userId
          );

          if (this.stats) {
            this.stats = {
              ...this.stats,
              totalUsers: Math.max(
                0,
                this.stats.totalUsers - 1
              ),
              bannedUsers: wasBanned
                ? Math.max(
                    0,
                    this.stats.bannedUsers - 1
                  )
                : this.stats.bannedUsers,
              pendingReports: Math.max(
                0,
                this.stats.pendingReports -
                  deletedReportsCount
              )
            };
          }

          this.deletingUsers.delete(userId);

          this.showToast(
            `@${username} was deleted successfully.`,
            'success'
          );
        },
        error: error => {
          this.deletingUsers.delete(userId);

          this.showToast(
            error?.error?.message ||
            `Unable to delete @${username}.`,
            'error'
          );
        }
      });
  }

  // ================================================================
  // DELETE POST
  // ================================================================

  private deletePost(
    postId: number,
    username: string
  ): void {

    if (this.isDeletingPost(postId)) {
      return;
    }

    this.deletingPosts.add(postId);
    this.confirmation = null;

    this.adminService
      .deletePost(postId)
      .subscribe({
        next: () => {
          const deletedReportsCount =
            this.reports.filter(
              report => report.targetPostId === postId
            ).length;

          const wasHidden =
            this.hiddenPosts.some(
              post => post.id === postId
            );

          this.reports = this.reports.filter(
            report => report.targetPostId !== postId
          );

          this.hiddenPosts = this.hiddenPosts.filter(
            post => post.id !== postId
          );

          if (this.stats) {
            this.stats = {
              ...this.stats,
              totalPosts: Math.max(
                0,
                this.stats.totalPosts - 1
              ),
              hiddenPosts: wasHidden
                ? Math.max(
                    0,
                    this.stats.hiddenPosts - 1
                  )
                : this.stats.hiddenPosts,
              pendingReports: Math.max(
                0,
                this.stats.pendingReports -
                  deletedReportsCount
              )
            };
          }

          this.deletingPosts.delete(postId);

          this.showToast(
            `The post by @${username} was deleted successfully.`,
            'success'
          );
        },
        error: error => {
          this.deletingPosts.delete(postId);

          this.showToast(
            error?.error?.message ||
            'Unable to delete this post.',
            'error'
          );
        }
      });
  }

  // ================================================================
  // STATE HELPERS
  // ================================================================

  private removeReport(reportId: number): void {
    this.reports = this.reports.filter(
      report => report.id !== reportId
    );

    if (this.stats) {
      this.stats = {
        ...this.stats,
        pendingReports: Math.max(
          0,
          this.stats.pendingReports - 1
        )
      };
    }
  }

  isProcessingReport(reportId: number): boolean {
    return this.processingReports.has(reportId);
  }

  isProcessingUser(userId: number): boolean {
    return this.processingUsers.has(userId);
  }

  isProcessingPost(postId: number): boolean {
    return this.processingPosts.has(postId);
  }

  isDeletingUser(userId: number): boolean {
    return this.deletingUsers.has(userId);
  }

  isDeletingPost(postId: number): boolean {
    return this.deletingPosts.has(postId);
  }

  // ================================================================
  // DATE
  // ================================================================

  formatDate(date: string): string {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Unknown date';
    }

    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(parsedDate);
  }

  // ================================================================
  // TOAST
  // ================================================================

  showToast(
    message: string,
    type: 'success' | 'error'
  ): void {

    this.toastMessage = message;
    this.toastType = type;

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
      this.toastTimeout = undefined;
    }, 3500);
  }

  dismissToast(): void {
    this.toastMessage = null;

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = undefined;
    }
  }
}