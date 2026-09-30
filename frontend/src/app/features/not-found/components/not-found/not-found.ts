import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-page">
      <div class="not-found-card">

        <div class="danger-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <div class="not-found-code">404</div>

        <h1>Page not found</h1>

        <p>
          The page you're looking for doesn't exist or is no longer available.
        </p>

        <a routerLink="/" class="home-button">
          Back to Home
        </a>

      </div>
    </div>
  `,
  styles: [`
    .not-found-page {
      min-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;

      background:
        radial-gradient(
          circle at center,
          rgba(127, 29, 29, 0.18) 0%,
          rgba(15, 23, 42, 0) 45%
        ),
        #0f172a;
    }

    .not-found-card {
      position: relative;
      width: 100%;
      max-width: 520px;
      padding: 3rem 2rem;
      text-align: center;

      background:
        linear-gradient(
          180deg,
          rgba(30, 24, 30, 0.98) 0%,
          rgba(17, 22, 34, 0.98) 100%
        );

      border: 1px solid rgba(239, 68, 68, 0.28);
      border-radius: 18px;

      box-shadow:
        0 10px 30px rgba(0, 0, 0, 0.4),
        0 0 35px rgba(239, 68, 68, 0.08);

      overflow: hidden;
    }

    .not-found-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;

      background: linear-gradient(
        90deg,
        #991b1b,
        #ef4444,
        #f87171,
        #ef4444,
        #991b1b
      );
    }

    .danger-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 1.2rem;

      display: flex;
      align-items: center;
      justify-content: center;

      color: #f87171;

      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 50%;

      box-shadow: 0 0 25px rgba(239, 68, 68, 0.08);
    }

    .not-found-code {
      font-size: 5rem;
      line-height: 1;
      font-weight: 800;
      letter-spacing: -0.05em;

      color: #f87171;

      margin-bottom: 1rem;

      text-shadow: 0 0 25px rgba(239, 68, 68, 0.15);
    }

    .not-found-card h1 {
      color: #f8fafc;
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .not-found-card p {
      max-width: 420px;
      margin: 0 auto 1.75rem;

      color: #94a3b8;
      line-height: 1.6;
    }

    .home-button {
      display: inline-block;

      padding: 0.65rem 1.3rem;

      color: #ffffff;
      background: #dc2626;

      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;

      text-decoration: none;
      font-weight: 600;

      transition:
        background-color 0.2s ease,
        transform 0.2s ease,
        box-shadow 0.2s ease;
    }

    .home-button:hover {
      background: #b91c1c;
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(220, 38, 38, 0.2);
    }
  `]
})
export class NotFoundComponent {}
