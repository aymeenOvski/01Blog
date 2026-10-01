import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { AdminService } from '../../services/admin.service';

import {
  AdminPost,
  AdminReport,
  AdminStats,
  AdminUser,
  AdminPage
} from '../../models/admin.model';

type AdminTab =
  | 'overview'
  | 'users'
  | 'posts'
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
    }
  | {
      type: 'ban-user';
      userId: number;
      username: string;
    }
  | {
      type: 'unban-user';
      userId: number;
      username: string;
    }
  | {
      type: 'hide-post';
      postId: number;
      username: string;
    }
  | {
      type: 'unhide-post';
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

  users: AdminUser[] = [];
  bannedUsers: AdminUser[] = [];

  posts: AdminPost[] = [];
  hiddenPosts: AdminPost[] = [];

  readonly pageSize = 20;
  usersPage: AdminPage<AdminUser> | null = null;
  postsPage: AdminPage<AdminPost> | null = null;
  bannedUsersPage: AdminPage<AdminUser> | null = null;
  hiddenPostsPage: AdminPage<AdminPost> | null = null;

  activeTab: AdminTab = 'overview';

  isLoadingStats = true;
  isLoadingReports = true;
  isLoadingUsers = false;
  isLoadingPosts = false;
  isLoadingBannedUsers = false;
  isLoadingHiddenPosts = false;

  statsError: string | null = null;
  reportsError: string | null = null;
  usersError: string | null = null;
  postsError: string | null = null;
  bannedUsersError: string | null = null;
  hiddenPostsError: string | null = null;

  private processingReports = new Set<number>();
  private processingUsers = new Set<number>();
  private processingPosts = new Set<number>();

  private deletingUsers = new Set<number>();
  private deletingPosts = new Set<number>();
  private clearingUserReports = new Set<number>();
  isClearingBannedUserReports = false;
  isClearingHiddenPostReports = false;

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
    this.loadUsers();
    this.loadPosts();
    this.loadBannedUsers();
    this.loadHiddenPosts();
  }

  get isRefreshing(): boolean {
    return (
      this.isLoadingStats ||
      this.isLoadingReports ||
      this.isLoadingUsers ||
      this.isLoadingPosts ||
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

  loadUsers(page = 0): void {
    this.isLoadingUsers = true;
    this.usersError = null;

    this.adminService.getAllUsers(page, this.pageSize).subscribe({
      next: response => {
        this.usersPage = response;
        this.users = response.content;
        this.isLoadingUsers = false;
      },

      error: error => {
        this.isLoadingUsers = false;

        this.usersError =
          error?.error?.message ||
          'Unable to load users.';
      }
    });
  }

  loadPosts(page = 0): void {
    this.isLoadingPosts = true;
    this.postsError = null;

    this.adminService.getAllPosts(page, this.pageSize).subscribe({
      next: response => {
        this.postsPage = response;
        this.posts = response.content;
        this.isLoadingPosts = false;
      },

      error: error => {
        this.isLoadingPosts = false;

        this.postsError =
          error?.error?.message ||
          'Unable to load posts.';
      }
    });
  }

  loadBannedUsers(page = 0): void {
    this.isLoadingBannedUsers = true;
    this.bannedUsersError = null;

    this.adminService.getBannedUsers(page, this.pageSize).subscribe({
      next: response => {
        this.bannedUsersPage = response;
        this.bannedUsers = response.content;
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

  loadHiddenPosts(page = 0): void {
    this.isLoadingHiddenPosts = true;
    this.hiddenPostsError = null;

    this.adminService.getHiddenPosts(page, this.pageSize).subscribe({
      next: response => {
        this.hiddenPostsPage = response;
        this.hiddenPosts = response.content;
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

  goToUsersPage(page: number): void {
    if (page >= 0 && page < (this.usersPage?.totalPages ?? 0)) {
      this.loadUsers(page);
    }
  }

  goToPostsPage(page: number): void {
    if (page >= 0 && page < (this.postsPage?.totalPages ?? 0)) {
      this.loadPosts(page);
    }
  }

  goToBannedUsersPage(page: number): void {
    if (page >= 0 && page < (this.bannedUsersPage?.totalPages ?? 0)) {
      this.loadBannedUsers(page);
    }
  }

  goToHiddenPostsPage(page: number): void {
    if (page >= 0 && page < (this.hiddenPostsPage?.totalPages ?? 0)) {
      this.loadHiddenPosts(page);
    }
  }

  pageNumbers(totalPages: number): number[] {
    return Array.from({ length: totalPages }, (_, index) => index);
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

  userReportsCountFor(userId: number): number {
    return this.reports.filter(
      report => report.type === 'USER' && report.targetUserId === userId
    ).length;
  }

  get bannedUserReportsCount(): number {
    const bannedUserIds = new Set(
      this.bannedUsers.map(user => user.id)
    );

    return this.reports.filter(
      report => report.type === 'USER' && bannedUserIds.has(report.targetUserId)
    ).length;
  }

  get hiddenPostReportsCount(): number {
    const hiddenPostIds = new Set(
      this.hiddenPosts.map(post => post.id)
    );

    return this.reports.filter(
      report => report.type === 'POST' && hiddenPostIds.has(report.targetPostId)
    ).length;
  }

  get pendingReportsCount(): number {
    return this.stats?.pendingReports ?? this.reports.length;
  }

  get currentResultCount(): number {
    switch (this.activeTab) {
      case 'users':
        return this.usersPage?.totalElements ?? this.users.length;

      case 'posts':
        return this.postsPage?.totalElements ?? this.posts.length;

      case 'user-reports':
        return this.userReports.length;

      case 'post-reports':
        return this.postReports.length;

      case 'banned-users':
        return this.bannedUsersPage?.totalElements ?? this.bannedUsers.length;

      case 'hidden-posts':
        return this.hiddenPostsPage?.totalElements ?? this.hiddenPosts.length;

      case 'overview':
      default:
        return this.reports.length;
    }
  }

  get currentResultLabel(): string {
    switch (this.activeTab) {
      case 'users':
        return (this.usersPage?.totalElements ?? this.users.length) === 1
          ? 'user'
          : 'users';

      case 'posts':
        return (this.postsPage?.totalElements ?? this.posts.length) === 1
          ? 'post'
          : 'posts';

      case 'user-reports':
        return this.userReports.length === 1
          ? 'user report'
          : 'user reports';

      case 'post-reports':
        return this.postReports.length === 1
          ? 'post report'
          : 'post reports';

      case 'banned-users':
        return (this.bannedUsersPage?.totalElements ?? this.bannedUsers.length) === 1
          ? 'banned user'
          : 'banned users';

      case 'hidden-posts':
        return (this.hiddenPostsPage?.totalElements ?? this.hiddenPosts.length) === 1
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
          this.processingReports.delete(report.id);

          this.removeReport(report.id);

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
          this.processingReports.delete(report.id);

          this.removeReport(report.id);

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

    this.askBanUser(
      report.targetUserId,
      report.targetUsername
    );
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

    this.askHidePost(
      report.targetPostId,
      report.targetUsername
    );
  }

  // ================================================================
  // USER MODERATION
  // ================================================================

  askBanUser(user: AdminUser | number, username?: string): void {
    const userId =
      typeof user === 'number'
        ? user
        : user.id;

    const userName =
      typeof user === 'number'
        ? username ?? 'this user'
        : user.username;

    if (this.isProcessingUser(userId)) {
      return;
    }

    this.confirmation = {
      type: 'ban-user',
      userId,
      username: userName
    };
  }

  askUnbanUser(user: AdminUser): void {
    if (this.isProcessingUser(user.id)) {
      return;
    }

    this.confirmation = {
      type: 'unban-user',
      userId: user.id,
      username: user.username
    };
  }

  dismissReportsForUser(user: AdminUser): void {
    if (this.isClearingUserReports(user.id)) {
      return;
    }

    const reportIds = this.reports
      .filter(report => report.type === 'USER' && report.targetUserId === user.id)
      .map(report => report.id);

    if (reportIds.length === 0) {
      return;
    }

    this.clearingUserReports.add(user.id);

    this.adminService.dismissUserReports(user.id).subscribe({
      next: () => {
        this.clearingUserReports.delete(user.id);
        this.reports = this.reports.filter(
          report => !reportIds.includes(report.id)
        );

        if (this.stats) {
          this.stats = {
            ...this.stats,
            pendingReports: Math.max(
              0,
              this.stats.pendingReports - reportIds.length
            )
          };
        }

        this.showToast(
          `Reports for @${user.username} were dismissed.`,
          'success'
        );
      },

      error: error => {
        this.clearingUserReports.delete(user.id);
        this.showToast(
          error?.error?.message ||
          `Unable to dismiss reports for @${user.username}.`,
          'error'
        );
      }
    });
  }

  dismissReportsForBannedUsers(): void {
    if (this.isClearingBannedUserReports || this.bannedUserReportsCount === 0) {
      return;
    }

    const bannedUserIds = new Set(
      this.bannedUsers.map(user => user.id)
    );
    const dismissedReportsCount = this.bannedUserReportsCount;

    this.isClearingBannedUserReports = true;

    this.adminService.dismissBannedUserReports().subscribe({
      next: () => {
        this.isClearingBannedUserReports = false;
        this.reports = this.reports.filter(
          report => report.type !== 'USER' || !bannedUserIds.has(report.targetUserId)
        );

        if (this.stats) {
          this.stats = {
            ...this.stats,
            pendingReports: Math.max(
              0,
              this.stats.pendingReports - dismissedReportsCount
            )
          };
        }

        this.showToast(
          'Reports for banned users were dismissed.',
          'success'
        );
      },

      error: error => {
        this.isClearingBannedUserReports = false;
        this.showToast(
          error?.error?.message ||
          'Unable to dismiss reports for banned users.',
          'error'
        );
      }
    });
  }

  dismissReportsForHiddenPosts(): void {
    if (this.isClearingHiddenPostReports || this.hiddenPostReportsCount === 0) {
      return;
    }

    const hiddenPostIds = new Set(
      this.hiddenPosts.map(post => post.id)
    );
    const dismissedReportsCount = this.hiddenPostReportsCount;

    this.isClearingHiddenPostReports = true;

    this.adminService.dismissHiddenPostReports().subscribe({
      next: () => {
        this.isClearingHiddenPostReports = false;
        this.reports = this.reports.filter(
          report => report.type !== 'POST' || !hiddenPostIds.has(report.targetPostId)
        );

        if (this.stats) {
          this.stats = {
            ...this.stats,
            pendingReports: Math.max(
              0,
              this.stats.pendingReports - dismissedReportsCount
            )
          };
        }

        this.showToast(
          'Reports for hidden posts were dismissed.',
          'success'
        );
      },

      error: error => {
        this.isClearingHiddenPostReports = false;
        this.showToast(
          error?.error?.message ||
          'Unable to dismiss reports for hidden posts.',
          'error'
        );
      }
    });
  }

  private executeBanUser(
    userId: number,
    username: string
  ): void {
    if (this.isProcessingUser(userId)) {
      return;
    }

    this.processingUsers.add(userId);
    this.confirmation = null;

    const userWasAlreadyBanned =
      this.users.some(
        user => user.id === userId && user.status === 'BANNED'
      ) ||
      this.bannedUsers.some(user => user.id === userId);

    this.adminService.banUser(userId).subscribe({
      next: () => {
        this.processingUsers.delete(userId);

        this.users = this.users.map(user =>
          user.id === userId
            ? {
                ...user,
                status: 'BANNED'
              }
            : user
        );

        const user = this.users.find(
          currentUser => currentUser.id === userId
        );

        if (user) {
          this.bannedUsers = [
            user,
            ...this.bannedUsers.filter(
              currentUser => currentUser.id !== userId
            )
          ];
        }

        if (this.stats && !userWasAlreadyBanned) {
          this.stats = {
            ...this.stats,
            bannedUsers: this.stats.bannedUsers + 1
          };
        }

        this.showToast(
          `@${username} has been banned.`,
          'success'
        );
      },

      error: error => {
        this.processingUsers.delete(userId);

        this.showToast(
          error?.error?.message ||
          `Unable to ban @${username}.`,
          'error'
        );
      }
    });
  }

  private executeUnbanUser(
    userId: number,
    username: string
  ): void {
    if (this.isProcessingUser(userId)) {
      return;
    }

    this.processingUsers.add(userId);
    this.confirmation = null;

    this.adminService.unbanUser(userId).subscribe({
      next: () => {
        this.processingUsers.delete(userId);

        this.users = this.users.map(user =>
          user.id === userId
            ? {
                ...user,
                status: 'ACTIVE'
              }
            : user
        );

        this.bannedUsers = this.bannedUsers.filter(
          user => user.id !== userId
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
          `@${username} has been unbanned.`,
          'success'
        );
      },

      error: error => {
        this.processingUsers.delete(userId);

        this.showToast(
          error?.error?.message ||
          `Unable to unban @${username}.`,
          'error'
        );
      }
    });
  }

  // ================================================================
  // POST MODERATION
  // ================================================================

  askHidePost(post: AdminPost | number, username?: string): void {
    const postId =
      typeof post === 'number'
        ? post
        : post.id;

    const postUsername =
      typeof post === 'number'
        ? username ?? 'this user'
        : post.username;

    if (this.isProcessingPost(postId)) {
      return;
    }

    this.confirmation = {
      type: 'hide-post',
      postId,
      username: postUsername
    };
  }

  askUnhidePost(post: AdminPost): void {
    if (this.isProcessingPost(post.id)) {
      return;
    }

    this.confirmation = {
      type: 'unhide-post',
      postId: post.id,
      username: post.username
    };
  }

  private executeHidePost(
    postId: number,
    username: string
  ): void {
    if (this.isProcessingPost(postId)) {
      return;
    }

    this.processingPosts.add(postId);
    this.confirmation = null;

    this.adminService.hidePost(postId).subscribe({
      next: () => {
        this.processingPosts.delete(postId);

        this.posts = this.posts.map(post =>
          post.id === postId
            ? {
                ...post,
                visibility: 'HIDDEN'
              }
            : post
        );

        const post = this.posts.find(
          currentPost => currentPost.id === postId
        );

        if (post) {
          this.hiddenPosts = [
            post,
            ...this.hiddenPosts.filter(
              currentPost => currentPost.id !== postId
            )
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
          `Unable to hide the post by @${username}.`,
          'error'
        );
      }
    });
  }

  private executeUnhidePost(
    postId: number,
    username: string
  ): void {
    if (this.isProcessingPost(postId)) {
      return;
    }

    this.processingPosts.add(postId);
    this.confirmation = null;

    this.adminService.unhidePost(postId).subscribe({
      next: () => {
        this.processingPosts.delete(postId);

        this.posts = this.posts.map(post =>
          post.id === postId
            ? {
                ...post,
                visibility: 'VISIBLE'
              }
            : post
        );

        this.hiddenPosts = this.hiddenPosts.filter(
          post => post.id !== postId
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
          `Post by @${username} is visible again.`,
          'success'
        );
      },

      error: error => {
        this.processingPosts.delete(postId);

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

  askDeleteUser(user: AdminUser): void {
    if (this.isDeletingUser(user.id)) {
      return;
    }

    this.confirmation = {
      type: 'delete-user',
      userId: user.id,
      username: user.username
    };
  }

  askDeletePost(post: AdminPost): void {
    if (this.isDeletingPost(post.id)) {
      return;
    }

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

    switch (confirmation.type) {
      case 'delete-user':
        this.deleteUser(
          confirmation.userId,
          confirmation.username
        );
        break;

      case 'delete-post':
        this.deletePost(
          confirmation.postId,
          confirmation.username
        );
        break;

      case 'ban-user':
        this.executeBanUser(
          confirmation.userId,
          confirmation.username
        );
        break;

      case 'unban-user':
        this.executeUnbanUser(
          confirmation.userId,
          confirmation.username
        );
        break;

      case 'hide-post':
        this.executeHidePost(
          confirmation.postId,
          confirmation.username
        );
        break;

      case 'unhide-post':
        this.executeUnhidePost(
          confirmation.postId,
          confirmation.username
        );
        break;
    }
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

          this.users = this.users.filter(
            user => user.id !== userId
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

          this.posts = this.posts.filter(
            post => post.id !== postId
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

  isClearingUserReports(userId: number): boolean {
    return this.clearingUserReports.has(userId);
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