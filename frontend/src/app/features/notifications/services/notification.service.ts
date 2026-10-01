import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client } from '@stomp/stompjs';
import { NotificationResponse } from '../models/notification.model';
import { AuthService } from '../../auth/services/auth.service';
import { PagedResponse } from '../../posts/models/post.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private http = inject(HttpClient);
    private authService = inject(AuthService);

    public notifications = signal<NotificationResponse[]>([]);
    public unreadCount = signal<number>(0);
    public isLoadingMore = signal(false);
    private notificationPage = 0;
    private notificationLastPage = false;

    private stompClient: Client | null = null;

    private authEffect = effect(() => {
        const username = this.authService.currentUser().username;

        if (username) {
            this.initWebSocket();
        } else {
            this.disconnect();
        }
    });

    public initWebSocket(): void {
        const username = this.authService.getUsername();
        const token = this.authService.getToken();

        if (!username || this.stompClient?.active) return;

        this.loadInitialNotifications(true);

        this.stompClient = new Client({
            brokerURL: 'ws://localhost:8080/ws',

            connectHeaders: {
                Authorization: `Bearer ${token}`
            },

            onConnect: () => {
                this.stompClient?.subscribe(
                    '/user/queue/notifications',
                    (message) => {
                        const newNotif: NotificationResponse =
                            JSON.parse(message.body);

                        this.notifications.update(list => [
                            newNotif,
                            ...list
                        ]);

                        this.unreadCount.update(count => count + 1);
                    }
                );
            }
        });

        this.stompClient.activate();
    }

    public loadInitialNotifications(reset = true): void {
        const page = reset ? 0 : this.notificationPage;
        if (!reset && (this.isLoadingMore() || this.notificationLastPage)) return;
        if (!reset) this.isLoadingMore.set(true);

        this.http
            .get<PagedResponse<NotificationResponse>>('/api/notifications', { params: { page, size: 20 } })
            .subscribe(response => {
                this.notifications.update(list => reset ? response.content : [...list, ...response.content]);
                this.notificationPage = response.number + 1;
                this.notificationLastPage = response.last;

                if (reset) {
                    this.unreadCount.set(response.content.filter(n => !n.isRead).length);
                }
                this.isLoadingMore.set(false);
            });
    }

    public loadMoreNotifications(): void {
        this.loadInitialNotifications(false);
    }

    public markAsRead(id: number): void {
        this.http
            .patch(`/api/notifications/${id}/read`, {})
            .subscribe(() => {

                this.notifications.update(list =>
                    list.map(n =>
                        n.id === id
                            ? { ...n, isRead: true }
                            : n
                    )
                );

                this.unreadCount.update(count =>
                    Math.max(0, count - 1)
                );
            });
    }

    public disconnect(): void {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = null;
        }
    }
}