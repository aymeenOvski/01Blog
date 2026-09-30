import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-page">
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>

      <div class="not-found-card">
        <div class="danger-icon-wrapper">
          <div class="danger-icon-pulse"></div>
          <div class="danger-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        <div class="not-found-code-wrapper">
          <span class="not-found-code">404</span>
          <span class="code-glow">404</span>
        </div>

        <h1>Lost in the Shadows?</h1>

        <p class="description">
          The destination you requested has drifted out of reach or no longer exists in system memory.
        </p>

        @if (errorMessage) {
          <div class="error-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        }

        <a routerLink="/" class="home-button">
          <span>Return to Safety</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"/>
            <path d="m12 5 7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-page {
      position: relative;
      min-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.5rem;
      background-color: #090d16;
      overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Background Atmospheric Glows */
    .bg-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      pointer-events: none;
      opacity: 0.5;
      animation: pulseGlow 8s ease-in-out infinite alternate;
    }

    .bg-glow-1 {
      width: 480px;
      height: 480px;
      top: -10%;
      left: 50%;
      transform: translateX(-50%);
      background: radial-gradient(circle, rgba(220, 38, 38, 0.35) 0%, rgba(0, 0, 0, 0) 70%);
    }

    .bg-glow-2 {
      width: 600px;
      height: 600px;
      bottom: -20%;
      right: 10%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(0, 0, 0, 0) 70%);
      animation-delay: -4s;
    }

    /* Glassmorphic Card */
    .not-found-card {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 500px;
      padding: 3.5rem 2.5rem;
      text-align: center;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      box-shadow:
        0 25px 50px -12px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(239, 68, 68, 0.15) inset,
        0 10px 30px -10px rgba(220, 38, 38, 0.2);
    }

    .not-found-card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 24px;
      padding: 1px;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.5), rgba(255, 255, 255, 0.05), rgba(99, 102, 241, 0.3));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    /* Danger Badge */
    .danger-icon-wrapper {
      position: relative;
      width: 72px;
      height: 72px;
      margin: 0 auto 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .danger-icon-pulse {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.3);
      animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    .danger-icon {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f87171;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 50%;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.25);
    }

    /* 404 Header Glow */
    .not-found-code-wrapper {
      position: relative;
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .not-found-code {
      font-size: 5.5rem;
      line-height: 1;
      font-weight: 900;
      letter-spacing: -0.04em;
      background: linear-gradient(180deg, #ffffff 0%, #f87171 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .code-glow {
      position: absolute;
      inset: 0;
      font-size: 5.5rem;
      line-height: 1;
      font-weight: 900;
      letter-spacing: -0.04em;
      color: #ef4444;
      filter: blur(18px);
      opacity: 0.6;
      z-index: -1;
    }

    /* Typography */
    .not-found-card h1 {
      color: #f8fafc;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.75rem;
    }

    .description {
      color: #94a3b8;
      font-size: 0.975rem;
      line-height: 1.6;
      margin: 0 auto 2rem;
      max-width: 380px;
    }

    /* Error Alert Badge */
    .error-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 0.6rem 1rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 2rem;
      backdrop-filter: blur(4px);
    }

    /* Button CTA */
    .home-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.875rem 1.75rem;
      color: #ffffff;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.35);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .home-button:hover {
      background: linear-gradient(135deg, #f87171 0%, #b91c1c 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(220, 38, 38, 0.5);
    }

    .home-button svg {
      transition: transform 0.2s ease;
    }

    .home-button:hover svg {
      transform: translateX(4px);
    }

    /* Animations */
    @keyframes pulseGlow {
      0% { opacity: 0.3; transform: scale(0.95) translateX(-50%); }
      100% { opacity: 0.6; transform: scale(1.05) translateX(-50%); }
    }

    @keyframes ping {
      75%, 100% {
        transform: scale(1.6);
        opacity: 0;
      }
    }
  `]
})
export class NotFoundComponent {
  errorMessage = '';

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.errorMessage = params['errorMessage'] || '';
    });
  }
}