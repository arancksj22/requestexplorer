import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <app-navbar />
    <main class="container">
      <router-outlet></router-outlet>
    </main>
    <app-footer />
  `,
  styles: [
    `
    :host {
      display: block;
      min-height: 100vh;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1rem;
      min-height: calc(100vh - 80px);
    }
    `
  ]
})
export class AppComponent {
  title = 'request-explorer-ng';
}
