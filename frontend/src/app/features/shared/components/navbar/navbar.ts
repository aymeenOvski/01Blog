import { Component, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { CreatePostModalComponent } from '../../../posts/components/create-post-modal/create-post-modal';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, CreatePostModalComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  public authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  isDropdownOpen = false;
  isCreatePostOpen = false;

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get username(): string {
    return this.authService.currentUser().username || 'User';
  }

  get avatarUrl(): string | null {
    return this.authService.currentUser().avatarUrl;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
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

  // Close dropdown when user clicks anywhere outside the component
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }
}
