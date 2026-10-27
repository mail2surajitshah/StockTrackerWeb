// import { Component, signal } from '@angular/core';
// import { RouterOutlet } from '@angular/router';

// @Component({
//   imports: [RouterOutlet],
//   selector: 'app-root',
//   styleUrl: './app.css',
//   templateUrl: './app.html',
// })
// export class App {
//   protected readonly title = signal('StockTrackerWeb');
// }
import { Component } from '@angular/core';
import { StockListComponent } from './stock-list.component';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  // imports: [StockListComponent],
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}