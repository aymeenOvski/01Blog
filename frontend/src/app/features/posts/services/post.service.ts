import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostResponse, PagedResponse } from '../models/post.model';
import { PostUpdateRequest, CommentRequest, CommentResponse } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  private apiUrl = '/api/posts';

  createPost(content: string, mediaFiles?: File[]): Observable<PostResponse> {
    const formData = new FormData();
    formData.append('content', content);

    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach(file => {
        formData.append('files', file);
      });
    }

    return this.http.post<PostResponse>(this.apiUrl, formData);
  }

  getUserPosts(username: string, page = 0, size = 10): Observable<PagedResponse<PostResponse>> {
    return this.http.get<PagedResponse<PostResponse>>(`${this.apiUrl}/user/${encodeURIComponent(username)}`, {
      params: { page, size }
    });
  }

  getFeed(page = 0, size = 10): Observable<PagedResponse<PostResponse>> {
    return this.http.get<PagedResponse<PostResponse>>(`${this.apiUrl}/feed`, {
      params: { page, size }
    });
  }

  updatePost(id: number, request: PostUpdateRequest): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.apiUrl}/${id}`, request);
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  repost(id: number): Observable<PostResponse> {
    return this.http.post<PostResponse>(`${this.apiUrl}/${id}/repost`, {});
  }

  toggleLike(id: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/like`, {});
  }

  getComments(id: number, page = 0, size = 10): Observable<PagedResponse<CommentResponse>> {
    return this.http.get<PagedResponse<CommentResponse>>(`${this.apiUrl}/${id}/comments`, {
      params: { page, size }
    });
  }

  addComment(id: number, request: CommentRequest): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`${this.apiUrl}/${id}/comments`, request);
  }
}
