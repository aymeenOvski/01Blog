import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8080/api/auth';

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
        if (response?.username) {
            localStorage.setItem('auth_username', response.username);
        }
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    getUsername(): string | null {
        return localStorage.getItem('auth_username');
    }

    getDecodedToken(): any | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payloadBase64 = token.split('.')[1];
            const decodedPayload = atob(payloadBase64);
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
        localStorage.removeItem('auth_username');
    }
}