import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface UserSession {
    username: string | null;
    avatarUrl: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8080/api/auth';

    currentUser = signal<UserSession>({
        username: this.getUsername(),
        avatarUrl: null
    });

    constructor(private http: HttpClient) { }

    register(userData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, userData).pipe(
            tap((res: any) => this.saveAuthData(res))
        );
    }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((res: any) => this.saveAuthData(res))
        );
    }

    saveAuthData(response: any): void {
        if (response?.token) {
            localStorage.setItem('auth_token', response.token);
        }

        const nextUsername = this.getUsername() ?? response?.username ?? null;
        const nextAvatarUrl = response?.avatarUrl ?? this.currentUser().avatarUrl ?? null;

        this.currentUser.set({
            username: nextUsername,
            avatarUrl: nextAvatarUrl
        });
    }

    updateSession(newUsername?: string | null, newToken?: string | null, newAvatarUrl?: string | null): void {
        if (newToken) {
            localStorage.setItem('auth_token', newToken);
        }

        const nextUsername = newUsername ?? this.getUsername();
        const nextAvatarUrl = newAvatarUrl !== undefined ? newAvatarUrl : this.currentUser().avatarUrl ?? null;

        this.currentUser.set({
            username: nextUsername,
            avatarUrl: nextAvatarUrl
        });
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    getUsername(): string | null {
        const decoded = this.getDecodedToken();
        return decoded?.sub ?? null;
    }

    getAvatarUrl(): string | null {
        return this.currentUser().avatarUrl ?? null;
    }

    getDecodedToken(): any | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payloadBase64 = token.split('.')[1];
            const normalizedPayload = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
            const paddedPayload = normalizedPayload + '='.repeat((4 - (normalizedPayload.length % 4)) % 4);
            const decodedPayload = atob(paddedPayload);
            return JSON.parse(decodedPayload);
        } catch (e) {
            return null;
        }
    }

    getRole(): string | null {
        const decoded = this.getDecodedToken();
        return decoded?.role || decoded?.roles || null;
    }

    logout(): void {
        localStorage.removeItem('auth_token');
        this.currentUser.set({ username: null, avatarUrl: null });
    }
}
