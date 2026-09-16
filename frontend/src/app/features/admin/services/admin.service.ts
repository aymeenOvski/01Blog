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
  AdminPost
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

  getBannedUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(
      `${this.apiUrl}/users/banned`
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

  getHiddenPosts(): Observable<AdminPost[]> {
    return this.http.get<AdminPost[]>(
      `${this.apiUrl}/posts/hidden`
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

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/users/${userId}`
    );
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/posts/${postId}`
    );
  }
}