import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.html',
    styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private http = inject(HttpClient);

    activeTab: 'profile' | 'account' = 'profile';

    profileData = {
        username: '',
        bio: '',
        avatarUrl: ''
    };

    accountData = {
        email: ''
    };

    passwordData = {
        currentPassword: '',
        newPassword: ''
    };

    loading = false;
    statusMessage: string | null = null;
    isError = false;

    get bioLength(): number {
        return this.profileData.bio ? this.profileData.bio.length : 0;
    }

    get isProfileValid(): boolean {
        const username = this.profileData.username ? this.profileData.username.trim() : '';
        const isValidUsername = username.length >= 3 && username.length <= 50;
        const isValidBio = this.bioLength <= 250;
        return isValidUsername && isValidBio && !this.loading;
    }

    get isPasswordValid(): boolean {
        const hasCurrentPassword = !!this.passwordData.currentPassword && this.passwordData.currentPassword.length > 0;
        const hasValidNewPassword = !!this.passwordData.newPassword && this.passwordData.newPassword.length >= 8 && this.passwordData.newPassword.length <= 100;
        return hasCurrentPassword && hasValidNewPassword && !this.loading;
    }

    ngOnInit(): void {
        const username = this.authService.getUsername();
        if (username) {
            this.userService.getUserProfile(username).subscribe({
                next: (data) => {
                    this.profileData.username = data.username;
                    this.profileData.bio = data.bio || '';
                    this.profileData.avatarUrl = data.avatarUrl || '';
                    this.accountData.email = data.email || '';
                },
                error: (err) => {
                    console.error('Failed to load user profile:', err);
                }
            });
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const formData = new FormData();
            formData.append('file', file);

            this.loading = true;
            this.statusMessage = 'Uploading avatar...';

            this.http.post<{ avatarUrl: string }>('/api/users/upload-avatar', formData)
                .subscribe({
                    next: (res) => {
                        this.loading = false;
                        this.isError = false;
                        this.statusMessage = null;
                        this.profileData.avatarUrl = res.avatarUrl;
                        this.authService.updateSession(undefined, undefined, res.avatarUrl);
                    },
                    error: (err) => {
                        this.loading = false;
                        this.isError = true;
                        this.statusMessage = 'Failed to upload avatar image.';
                    }
                });
        }
    }

    saveProfile(): void {
        if (!this.isProfileValid) return;

        this.loading = true;
        this.statusMessage = null;

        this.userService.updateProfileInfo({
            username: this.profileData.username,
            bio: this.profileData.bio,
            avatarUrl: this.profileData.avatarUrl
        }).subscribe({
            next: (updatedProfile) => {
                this.loading = false;
                this.isError = false;
                this.statusMessage = 'Profile updated successfully!';
                this.profileData.username = updatedProfile.username || '';
                this.profileData.bio = updatedProfile.bio || '';
                this.profileData.avatarUrl = updatedProfile.avatarUrl || '';

                this.authService.updateSession(updatedProfile.username, updatedProfile.token, updatedProfile.avatarUrl);
            },
            error: (err) => {
                this.loading = false;
                this.isError = true;
                this.statusMessage = err.error?.message || 'Failed to update profile.';
            }
        });
    }

    updatePassword(): void {
        if (!this.isPasswordValid) return;

        this.loading = true;
        this.statusMessage = null;

        this.userService.updateProfileSecurity({
            oldPassword: this.passwordData.currentPassword,
            newPassword: this.passwordData.newPassword
        }).subscribe({
            next: () => {
                this.loading = false;
                this.isError = false;
                this.statusMessage = 'Password updated successfully!';
                this.passwordData.currentPassword = '';
                this.passwordData.newPassword = '';
            },
            error: (err) => {
                this.loading = false;
                this.isError = true;
                this.statusMessage = err.error?.message || 'Failed to update password.';
            }
        });
    }
}
