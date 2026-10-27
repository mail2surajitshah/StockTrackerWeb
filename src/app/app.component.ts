import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <main class="container">
      <h1>Stock Manager</h1>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Stocks</a>
        <a routerLink="/import" routerLinkActive="active">Import from Excel</a>
      </nav>
      <router-outlet />
    </main>
  `,
  styles: [`
    .container { max-width: 900px; margin: 24px auto; padding: 0 16px; font-family: system-ui, sans-serif; }
    h1 { margin-bottom: 12px; }
    nav { display: flex; gap: 8px; margin-bottom: 20px; }
    nav a { padding: 6px 14px; border: 1px solid #c7ccd1; border-radius: 4px; text-decoration: none; color: #333; }
    nav a.active { background: #1f6feb; border-color: #1f6feb; color: #fff; }
  `]
})
export class AppComponent {}
