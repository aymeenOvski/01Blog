import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  UserProfileResponse,
  UserSecurityResponse,
  UpdateProfileInfoRequest,
  UpdateProfileSecurityRequest
} from '../models/user-profile.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:8080/api/users';

  getUserProfile(username: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/${username}`).pipe(
      tap((res) => {
        if (username === this.authService.getUsername()) {
          this.authService.updateSession(res.username, undefined, res.avatarUrl);
        }
      })
    );
  }

  updateProfileInfo(request: UpdateProfileInfoRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/profile/info`, request).pipe(
      tap((res) => {
        this.authService.updateSession(res.username, undefined, res.avatarUrl);
      })
    );
  }

  updateProfileSecurity(request: UpdateProfileSecurityRequest): Observable<UserSecurityResponse> {
    return this.http.put<UserSecurityResponse>(`${this.apiUrl}/profile/security`, request);
  }
}
