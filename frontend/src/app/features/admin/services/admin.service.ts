import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AdminReport,
  AdminStats,
  AdminUser,
  AdminPost,
  AdminPage
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private http = inject(HttpClient);
  private readonly apiUrl = '/api/admin';

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(
      `${this.apiUrl}/stats`
    );
  }

  getPendingReports(): Observable<AdminReport[]> {
    return this.http.get<AdminReport[]>(
      `${this.apiUrl}/reports`
    );
  }

  updateReport(
    reportId: number,
    action: 'RESOLVE' | 'DISMISS'
  ): Observable<void> {
    const params = new HttpParams()
      .set('action', action);

    return this.http.patch<void>(
      `${this.apiUrl}/reports/${reportId}`,
      {},
      { params }
    );
  }

  dismissUserReports(userId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/users/${userId}/reports/dismiss`,
      {}
    );
  }

  dismissBannedUserReports(): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/users/banned/reports/dismiss`,
      {}
    );
  }

  dismissHiddenPostReports(): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/posts/hidden/reports/dismiss`,
      {}
    );
  }

  getAllUsers(page = 0, size = 20): Observable<AdminPage<AdminUser>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<AdminPage<AdminUser>>(
      `${this.apiUrl}/users`, { params }
    );
  }

  getBannedUsers(page = 0, size = 20): Observable<AdminPage<AdminUser>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<AdminPage<AdminUser>>(
      `${this.apiUrl}/users/banned`, { params }
    );
  }

  banUser(userId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/users/${userId}/ban`,
      {}
    );
  }

  unbanUser(userId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/users/${userId}/unban`,
      {}
    );
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/users/${userId}`
    );
  }

  getAllPosts(page = 0, size = 20): Observable<AdminPage<AdminPost>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<AdminPage<AdminPost>>(
      `${this.apiUrl}/posts`, { params }
    );
  }

  getHiddenPosts(page = 0, size = 20): Observable<AdminPage<AdminPost>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<AdminPage<AdminPost>>(
      `${this.apiUrl}/posts/hidden`, { params }
    );
  }

  hidePost(postId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/posts/${postId}/hide`,
      {}
    );
  }

  unhidePost(postId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/posts/${postId}/unhide`,
      {}
    );
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/posts/${postId}`
    );
  }
}