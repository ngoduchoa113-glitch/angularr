import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, submit, FormField, required, email, minLength, pattern, applyWhen } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../stores/auth-store';
import { AuthApiService } from '../services/auth-api.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

// US-01: Sign In / Sign Up / Quên mật khẩu gộp chung 1 trang duy nhất, chuyển đổi
// bằng state nội bộ (mode) chứ không tách route riêng biệt.
export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

function emptyAuthModel() {
  return { email: '', password: '', confirmPassword: '', newPassword: '' };
}

// Toàn bộ copy trang này bằng tiếng Việt, đồng nhất với phần còn lại của app —
// vẫn giữ giọng văn "phù thủy/sách phép" của theme Grimoire.
const PASSWORD_HINT = 'Ít nhất 8 ký tự, gồm 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt.';

const COPY: Record<AuthMode, { title: string; subtitle: string; submitLabel: string; submitIcon: string }> = {
  signin: {
    title: 'Bếp Phù Thủy Lúc Nửa Đêm',
    subtitle: 'Chào mừng trở lại, lữ khách. Nhập thông tin để bước vào gian bếp.',
    submitLabel: 'Bước Vào Gian Bếp',
    submitIcon: 'login',
  },
  signup: {
    title: 'Tạo Tài Khoản Của Bạn',
    subtitle: 'Phù thủy nào cũng cần một nơi lưu giữ phép thuật của mình.',
    submitLabel: 'Tạo Tài Khoản',
    submitIcon: 'auto_stories',
  },
  forgot: {
    title: 'Khôi Phục Tài Khoản',
    subtitle: 'Nhập email và chúng tôi sẽ gửi một lá bùa để đặt lại mật khẩu.',
    submitLabel: 'Gửi Lá Bùa',
    submitIcon: 'mail',
  },
  reset: {
    title: 'Niệm Mật Khẩu Mới',
    subtitle: 'Chọn mật khẩu mới để niêm phong sách phép của bạn.',
    submitLabel: 'Niêm Phong',
    submitIcon: 'lock_reset',
  },
};

@Component({
  selector: 'app-auth',
  imports: [
    FormField,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule,
  ],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {

  private readonly authStore = inject(AuthStore);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly mode = signal<AuthMode>('signin');
  private resetToken: string | null = null;

  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly passwordHint = PASSWORD_HINT;

  protected readonly title = computed(() => COPY[this.mode()].title);
  protected readonly subtitle = computed(() => COPY[this.mode()].subtitle);
  protected readonly submitLabel = computed(() => COPY[this.mode()].submitLabel);
  protected readonly submitIcon = computed(() => COPY[this.mode()].submitIcon);

  // Nội dung liên kết chuyển mode ở cuối form — gộp lại thành 1 computed thay vì
  // @switch dài trong template, dễ đọc hơn khi copy đã đổi hết sang tiếng Anh.
  protected readonly switchLink = computed(() => {
    switch (this.mode()) {
      case 'signin': return { prompt: 'Lần đầu ghé bếp?', label: 'Tạo Tài Khoản', target: 'signup' as AuthMode };
      case 'signup': return { prompt: 'Đã là phù thủy?', label: 'Bước Vào Gian Bếp', target: 'signin' as AuthMode };
      case 'forgot': return { prompt: 'ĐM, Nhớ ra rồi?', label: 'Quay Lại Gian Bếp', target: 'signin' as AuthMode };
      case 'reset': return { prompt: '', label: 'Quay Lại Đăng Nhập', target: 'signin' as AuthMode };
    }
  });

  protected readonly authModel = signal(emptyAuthModel());

  protected readonly authForm = form(this.authModel, (path) => {
    applyWhen(path.email, () => this.mode() !== 'reset', (p) => {
      required(p, { message: 'Vui lòng nhập email' });
      email(p, { message: 'Email không hợp lệ' });
    });

    applyWhen(path.password, () => this.mode() === 'signin' || this.mode() === 'signup', (p) => {
      required(p, { message: 'Vui lòng nhập mật khẩu' });
    });

    applyWhen(path.password, () => this.mode() === 'signup', (p) => {
      minLength(p, 8, { message: 'Ít nhất 8 ký tự' });
      pattern(p, /[A-Z]/, { message: 'Cần ít nhất 1 chữ hoa' });
      pattern(p, /[0-9]/, { message: 'Cần ít nhất 1 chữ số' });
      pattern(p, /[^A-Za-z0-9]/, { message: 'Cần ít nhất 1 ký tự đặc biệt' });
    });

    applyWhen(path.confirmPassword, () => this.mode() === 'signup', (p) => {
      required(p, { message: 'Vui lòng xác nhận mật khẩu' });
    });

    applyWhen(path.newPassword, () => this.mode() === 'reset', (p) => {
      required(p, { message: 'Vui lòng nhập mật khẩu mới' });
      minLength(p, 8, { message: 'Ít nhất 8 ký tự' });
      pattern(p, /[A-Z]/, { message: 'Cần ít nhất 1 chữ hoa' });
      pattern(p, /[0-9]/, { message: 'Cần ít nhất 1 chữ số' });
      pattern(p, /[^A-Za-z0-9]/, { message: 'Cần ít nhất 1 ký tự đặc biệt' });
    });
  });

  protected readonly formError = signal<string | null>(null);
  protected readonly formSuccess = signal<string | null>(null);
  protected readonly submitting = signal(false);

  // Panel minh hoạ căn nhà "bước vào" khi đăng nhập/đăng ký thành công — xem
  // onActionSucceeded(). Chỉ dùng cho hiệu ứng, không chặn logic điều hướng.
  protected readonly transitioningOut = signal(false);

  constructor() {
    // US-01: nút "Đăng nhập"/"Đăng ký" ở header (app.html) điều hướng tới /auth
    // kèm queryParams mode=... — vẫn là route /auth nên Angular tái dùng lại
    // đúng component instance này (chỉ queryParams đổi), ngOnInit đọc 1 lần sẽ
    // không chạy lại. Theo dõi queryParamMap phản ứng ở đây để các nút đó thực
    // sự đổi được mode kể cả khi đã đứng sẵn trên trang /auth.
    effect(() => {
      const params = this.queryParamMap();
      const requestedMode = params.get('mode');
      const token = params.get('token');

      if (requestedMode === 'reset' && token) {
        this.resetToken = token;
        this.mode.set('reset');
      } else if (requestedMode === 'signup' || requestedMode === 'forgot') {
        this.mode.set(requestedMode);
      } else {
        this.mode.set('signin');
      }
    });
  }

  protected switchMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.authModel.set(emptyAuthModel());
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    this.formSuccess.set(null);

    if (this.mode() === 'signup') {
      const { password, confirmPassword } = this.authModel();
      if (password !== confirmPassword) {
        this.formError.set('Mật khẩu không khớp');
        this.snackBar.open(this.formError()!, 'Close', { duration: 4000 });
        return;
      }
    }

    this.submitting.set(true);
    const ok = await submit(this.authForm, async () => {
      const { email, password, newPassword } = this.authModel();
      try {
        await this.runAction(email, password, newPassword);
      } catch (err) {
        this.formError.set(this.resolveError(err));
      }
    });
    this.submitting.set(false);

    const error = this.formError();
    if (!ok || error) {
      if (error) {
        this.snackBar.open(error, 'Close', { duration: 4000 });
      }
      return;
    }

    await this.onActionSucceeded();
  }

  private async runAction(email: string, password: string, newPassword: string): Promise<void> {
    switch (this.mode()) {
      case 'signin':
        await this.authStore.login(email, password);
        return;
      case 'signup':
        await this.authStore.register(email, password);
        return;
      case 'forgot':
        await firstValueFrom(this.authApi.forgotPassword(email));
        this.formSuccess.set('Nếu email này có trong sách phép của chúng tôi, một lá bùa đặt lại mật khẩu đang trên đường gửi tới.');
        return;
      case 'reset':
        if (!this.resetToken) {
          throw new Error('missing-reset-token');
        }
        await firstValueFrom(this.authApi.resetPassword(this.resetToken, newPassword));
        this.formSuccess.set('Mật khẩu đã được niêm phong. Vui lòng đăng nhập lại.');
        return;
    }
  }

  private async onActionSucceeded(): Promise<void> {
    if (this.mode() === 'signin' || this.mode() === 'signup') {
      // Hiệu ứng "bước qua cửa": panel căn nhà phóng to/mờ dần trước khi rời trang
      // — xem .auth-shell.leaving trong auth.css. Thời gian chờ khớp với CSS
      // transition (550ms) để không cắt animation giữa chừng.
      this.transitioningOut.set(true);
      await new Promise((resolve) => setTimeout(resolve, 550));

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/recipes';
      await this.router.navigateByUrl(returnUrl);
      return;
    }

    if (this.mode() === 'reset') {
      this.switchMode('signin');
    }
    // Chế độ 'forgot' giữ nguyên trên trang để người dùng thấy thông báo thành công.
  }

  private resolveError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const serverMessage = err.error?.message;
      if (Array.isArray(serverMessage)) {
        return serverMessage.join(', ');
      }
      if (typeof serverMessage === 'string') {
        return serverMessage;
      }
      if (err.status === 401) {
        return 'Email hoặc mật khẩu không đúng';
      }
      if (err.status === 409) {
        return 'Email đã được sử dụng';
      }
    }
    if (err instanceof Error && err.message === 'missing-reset-token') {
      return 'Liên kết đặt lại mật khẩu không hợp lệ, vui lòng yêu cầu lại';
    }
    return 'Có lỗi xảy ra, vui lòng thử lại sau';
  }

}
