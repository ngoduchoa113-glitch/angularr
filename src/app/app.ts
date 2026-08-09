import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { ThemeStore } from './stores/theme-store';

// Dưới ngưỡng này, drawer trượt đè lên nội dung (mode="over") thay vì nằm cố định bên cạnh.
const WIDE_SCREEN_QUERY = '(min-width: 840px)';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('My Recipe Box');

  protected readonly themeStore = inject(ThemeStore);

  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isWideScreen = toSignal(
    this.breakpointObserver.observe(WIDE_SCREEN_QUERY).pipe(map((state) => state.matches)),
    { initialValue: true },
  );

  protected readonly sidenavMode = computed(() => (this.isWideScreen() ? 'side' : 'over'));

  // Mặc định mở/đóng theo kích thước màn hình, nhưng vẫn cho người dùng tự bật/tắt bằng nút ☰.
  protected readonly sidenavOpened = signal(true);

  constructor() {
    effect(() => {
      this.sidenavOpened.set(this.isWideScreen());
    });
  }
}
