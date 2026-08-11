import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UserProfileResponse,
  UserSecurityResponse,
  UpdateProfileInfoRequest,
  UpdateProfileSecurityRequest
} from '../models/user-profile.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/users';

  getUserProfile(username: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/${username}`);
  }

  updateProfileInfo(request: UpdateProfileInfoRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/profile/info`, request);
  }

  updateProfileSecurity(request: UpdateProfileSecurityRequest): Observable<UserSecurityResponse> {
    return this.http.put<UserSecurityResponse>(`${this.apiUrl}/profile/security`, request);
  }
}
