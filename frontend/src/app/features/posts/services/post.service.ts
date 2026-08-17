import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostResponse } from '../models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  private apiUrl = '/api/posts';

  createPost(content: string, mediaFile?: File | null): Observable<PostResponse> {
    const formData = new FormData();
    formData.append('content', content);

    if (mediaFile) {
      formData.append('file', mediaFile);
    }

    return this.http.post<PostResponse>(this.apiUrl, formData);
  }

  getUserPosts(username: string): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.apiUrl}/user/${encodeURIComponent(username)}`);
  }
}
