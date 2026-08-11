import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private authService = inject(AuthService);

  username = this.authService.getUsername();

  get profileLink(): string[] | null {
    return this.username ? ['/profile', this.username] : null;
  }
}