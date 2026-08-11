import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

    activeTab: 'profile' | 'account' = 'account';

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

    ngOnInit(): void {
        const username = this.authService.getUsername();
        if (username) {
            this.userService.getUserProfile(username).subscribe({
                next: (data) => {
                    this.profileData.username = data.username;
                    this.profileData.bio = data.bio || '';
                    this.accountData.email = data.email || '';
                }
            });
        }
    }

    saveProfile(): void {
        this.loading = true;
        this.statusMessage = null;

        this.userService.updateProfileInfo({
            bio: this.profileData.bio,
            avatarUrl: this.profileData.avatarUrl
        }).subscribe({
            next: (updatedProfile) => {
                this.loading = false;
                this.isError = false;
                this.statusMessage = 'Profile updated successfully!';

                // Refresh local state with updated values
                this.profileData.bio = updatedProfile.bio || '';
                this.profileData.avatarUrl = updatedProfile.avatarUrl || '';
            },
            error: (err) => {
                this.loading = false;
                this.isError = true;
                this.statusMessage = err.error?.message || 'Failed to update profile.';
            }
        });
    }

    updatePassword(): void {
        if (!this.passwordData.currentPassword || !this.passwordData.newPassword) {
            this.statusMessage = 'Please fill in both password fields.';
            this.isError = true;
            return;
        }

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