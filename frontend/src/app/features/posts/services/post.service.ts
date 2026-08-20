import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostResponse } from '../models/post.model';
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

  getUserPosts(username: string): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.apiUrl}/user/${encodeURIComponent(username)}`);
  }

  updatePost(id: number, request: PostUpdateRequest): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.apiUrl}/${id}`, request);
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleLike(id: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/like`, {});
  }

  getComments(id: number): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`${this.apiUrl}/${id}/comments`);
  }

  addComment(id: number, request: CommentRequest): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`${this.apiUrl}/${id}/comments`, request);
  }
}
