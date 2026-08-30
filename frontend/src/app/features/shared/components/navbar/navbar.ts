import { Component, inject, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { CreatePostModalComponent } from '../../../posts/components/create-post-modal/create-post-modal';
import { NotificationService } from '../../../notifications/services/notification.service';
import { NotificationResponse } from '../../../notifications/models/notification.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, CreatePostModalComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  public notificationService = inject(NotificationService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  isNotificationsOpen = false;
  isProfileDropDownOpen = false;
  isCreatePostOpen = false;

  ngOnInit(): void {
    if (this.isLoggedIn) {
      this.notificationService.initWebSocket();
    }
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get username(): string {
    return this.authService.currentUser().username || 'User';
  }

  get avatarUrl(): string | null {
    return this.authService.currentUser().avatarUrl;
  }

  closeDropdown(): void {
    this.isProfileDropDownOpen = false;
  }

  openCreatePost(): void {
    this.isCreatePostOpen = true;
  }

  closeCreatePost(): void {
    this.isCreatePostOpen = false;
  }

  logout(): void {
    this.closeDropdown();
    this.authService.logout();
    this.router.navigate(['/login']);
  }


  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      this.isProfileDropDownOpen = false;
    }
  }

  toggleDropdown(): void {
    this.isProfileDropDownOpen = !this.isProfileDropDownOpen;
    if (this.isProfileDropDownOpen) {
      this.isNotificationsOpen = false;
    }
  }

  onNotificationClick(notification: NotificationResponse | any): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id);
    }

    this.isNotificationsOpen = false;

    if (notification.type === 'FOLLOW') {
      this.router.navigate(['/profile', notification.actorUsername]);
    } else if (
      (notification.type === 'POST' || notification.type === 'LIKE' || notification.type === 'COMMENT') &&
      notification.targetId
    ) {
      this.router.navigate(['/posts', notification.targetId]);
    }
  }

  // Close dropdown when user clicks anywhere outside the component
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isProfileDropDownOpen = false;
      this.isNotificationsOpen = false;
    }
  }
}
