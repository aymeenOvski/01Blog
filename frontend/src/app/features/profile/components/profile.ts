import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserService } from '../services/user.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserProfileResponse } from '../models/user-profile.model';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  private routeSub?: Subscription;

  profile: UserProfileResponse | null = null;
  currentUser = this.authService.getUsername();
  isOwner = false;
  loading = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const username = params.get('username') || this.currentUser;
      if (username) {
        this.loadProfile(username);
      }
    });
  }

  loadProfile(username: string): void {
    this.loading = true;
    this.userService.getUserProfile(username).subscribe({
      next: (data) => {
        this.profile = data;
        this.isOwner = data.isOwner;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load user profile';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }
}