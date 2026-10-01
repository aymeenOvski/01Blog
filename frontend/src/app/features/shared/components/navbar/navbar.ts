import {
  Component,
  inject,
  ElementRef,
  HostListener,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../../profile/services/user.service';
import { UserSummary } from '../../../profile/models/user-profile.model';

import {
  CreatePostModalComponent
} from '../../../posts/components/create-post-modal/create-post-modal';

import {
  NotificationService
} from '../../../notifications/services/notification.service';

import {
  NotificationResponse
} from '../../../notifications/models/notification.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    CreatePostModalComponent
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  public notificationService = inject(NotificationService);

  public authService = inject(AuthService);

  private router = inject(Router);

  private elementRef = inject(ElementRef);

  private userService = inject(UserService);

  private searchQuery$ = new Subject<string>();

  private searchSubscription?: Subscription;

  isNotificationsOpen = false;

  isProfileDropDownOpen = false;

  isCreatePostOpen = false;

  searchQuery = '';

  searchResults: UserSummary[] = [];

  isSearching = false;

  ngOnInit(): void {

    if (this.isLoggedIn) {
      this.notificationService.initWebSocket();
    }

    this.searchSubscription = this.searchQuery$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        const normalizedQuery = query.trim();
        if (normalizedQuery.length < 2) {
          this.isSearching = false;
          return of([] as UserSummary[]);
        }

        this.isSearching = true;
        return this.userService.searchUsers(normalizedQuery).pipe(
          catchError(() => of([] as UserSummary[]))
        );
      })
    ).subscribe(results => {
      this.searchResults = results;
      this.isSearching = false;
    });

  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isAdmin(): boolean {
    return this.authService.getRole() === 'ROLE_ADMIN';
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

  onSearchInput(query: string): void {
    this.searchQuery$.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearching = false;
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

    this.isProfileDropDownOpen =
      !this.isProfileDropDownOpen;

    if (this.isProfileDropDownOpen) {
      this.isNotificationsOpen = false;
    }

  }

  onNotificationScroll(event: Event): void {
    const element = event.target as HTMLElement;

    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 40) {
      this.notificationService.loadMoreNotifications();
    }
  }

  onNotificationClick(
    notification: NotificationResponse | any
  ): void {

    if (!notification.isRead) {
      this.notificationService.markAsRead(
        notification.id
      );
    }

    this.isNotificationsOpen = false;

    if (notification.type === 'FOLLOW') {

      this.router.navigate([
        '/profile',
        notification.actorUsername
      ]);

    } else if (
      (
        notification.type === 'POST' ||
        notification.type === 'LIKE' ||
        notification.type === 'COMMENT'
      ) &&
      notification.targetId
    ) {

      this.router.navigate([
        '/posts',
        notification.targetId
      ]);

    }

  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as Node | null;
    const searchElement = this.elementRef.nativeElement.querySelector('.user-search');

    if (
      !this.elementRef.nativeElement.contains(
        event.target
      )
    ) {

      this.isProfileDropDownOpen = false;

      this.isNotificationsOpen = false;

    }

    if (target && !searchElement?.contains(target)) {
      this.clearSearch();
    }

  }

}