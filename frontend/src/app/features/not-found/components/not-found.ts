import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
  <div class="not-found-page">
    <div class="not-found-card">

      <div class="not-found-code">404</div>

      <h1>Page not found</h1>

      <p class="description">
        The page you're looking for doesn't exist or may have been moved.
      </p>

      @if (errorMessage) {
        <div class="error-message">
          {{ errorMessage }}
        </div>
      }

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
    padding: 2rem 1rem;
    background: #090d16;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .not-found-card {
  width: 100%;
  max-width: 440px;
  padding: 3rem 2rem;
  text-align: center;
  background: #0f172a;
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}


  .not-found-code {
  margin-bottom: 0.5rem;
  color: #f87171;
  font-size: 5rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
}

  .not-found-card h1 {
    margin: 0 0 0.75rem;
    color: #f8fafc;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .description {
    max-width: 360px;
    margin: 0 auto 1.5rem;
    color: #94a3b8;
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .error-message {
    margin-bottom: 1.5rem;
    padding: 0.75rem 1rem;
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    font-size: 0.85rem;
  }

  .home-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1.25rem;
  color: #ffffff;
  background: #dc2626;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

  .home-button:hover {
  color: #ffffff;
  background: #b91c1c;
}

  @media (max-width: 576px) {
    .not-found-card {
      padding: 2.5rem 1.5rem;
    }

    .not-found-code {
      font-size: 4rem;
    }

    .not-found-card h1 {
      font-size: 1.35rem;
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