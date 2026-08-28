import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client } from '@stomp/stompjs';
import { NotificationResponse } from '../models/notification.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    public notifications = signal<NotificationResponse[]>([]);
    public unreadCount = signal<number>(0);
    private stompClient: Client | null = null;

    public initWebSocket(): void {
        const username = this.authService.getUsername();
        const token = this.authService.getToken();
        if (!username || this.stompClient?.active) return;

        this.loadInitialNotifications();

        this.stompClient = new Client({
            brokerURL: 'ws://localhost:8080/ws',
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                this.stompClient?.subscribe('/user/queue/notifications', (message) => {
                    const newNotif: NotificationResponse = JSON.parse(message.body);
                    this.notifications.update(list => [newNotif, ...list]);
                    this.unreadCount.update(c => c + 1);
                });
            }
        });

        this.stompClient.activate();
    }

    public loadInitialNotifications(): void {
        this.http.get<NotificationResponse[]>('/api/notifications').subscribe((data) => {
            this.notifications.set(data);
            this.unreadCount.set(data.filter(n => !n.isRead).length);
        });
    }

    public markAsRead(id: number): void {
        this.http.patch(`/api/notifications/${id}/read`, {}).subscribe(() => {
            this.notifications.update(list =>
                list.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            this.unreadCount.update(c => Math.max(0, c - 1));
        });
    }

    public disconnect(): void {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = null;
        }
    }
}