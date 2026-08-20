import { Component, inject, signal } from '@angular/core';
import { form, submit, FormField, required, minLength, pattern } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../stores/auth-store';
import { UserApiService } from '../services/user-api.service';
import { UploadApiService } from '../services/upload-api.service';
import { resolveImageError } from '../services/resolve-image-error';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

function resolveErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const serverMessage = err.error?.message;
    if (Array.isArray(serverMessage)) {
      return serverMessage.join(', ');
    }
    if (typeof serverMessage === 'string') {
      return serverMessage;
    }
  }
  return fallback;
}

@Component({
  selector: 'app-profile',
  imports: [
    FormField,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCardModule, MatProgressSpinnerModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {

  private readonly authStore = inject(AuthStore);
  private readonly userApi = inject(UserApiService);
  private readonly uploadApi = inject(UploadApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly currentUser = this.authStore.user;

  // --- Sửa name/avatar ---
  protected readonly profileModel = signal({
    name: this.currentUser()?.name ?? '',
    avatarUrl: this.currentUser()?.avatarUrl ?? '',
  });

  protected readonly profileForm = form(this.profileModel, (path) => {
    // Không bắt buộc name — chỉ giới hạn độ dài để tránh input quá khổ.
  });

  protected readonly savingProfile = signal(false);
  protected readonly uploadingAvatar = signal(false);

  protected async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Chỉ chấp nhận file ảnh', 'Đóng', { duration: 3000 });
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      this.snackBar.open('Ảnh tối đa 5MB', 'Đóng', { duration: 3000 });
      return;
    }

    this.uploadingAvatar.set(true);
    try {
      const { url } = await firstValueFrom(this.uploadApi.uploadImage(file));
      this.profileModel.update((model) => ({ ...model, avatarUrl: url }));
    } catch (err) {
      const message = resolveImageError(err, resolveErrorMessage(err, 'Tải ảnh thất bại, thử lại sau'));
      this.snackBar.open(message, 'Đóng', { duration: 4000 });
    } finally {
      this.uploadingAvatar.set(false);
    }
  }

  protected async saveProfile(event: Event): Promise<void> {
    event.preventDefault();
    this.savingProfile.set(true);
    try {
      const { name, avatarUrl } = this.profileModel();
      const updated = await firstValueFrom(this.userApi.updateProfile({ name, avatarUrl }));
      this.authStore.patchUser({ name: updated.name, avatarUrl: updated.avatarUrl });
      this.snackBar.open('Đã lưu thông tin', 'Đóng', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(resolveErrorMessage(err, 'Không thể lưu, thử lại sau'), 'Đóng', { duration: 4000 });
    } finally {
      this.savingProfile.set(false);
    }
  }

  // --- Đổi mật khẩu ---
  protected readonly passwordModel = signal({ currentPassword: '', newPassword: '', confirmNewPassword: '' });

  protected readonly passwordForm = form(this.passwordModel, (path) => {
    required(path.currentPassword, { message: 'Nhập mật khẩu hiện tại' });

    required(path.newPassword, { message: 'Mật khẩu mới không được bỏ trống' });
    minLength(path.newPassword, 8, { message: 'Mật khẩu tối thiểu 8 ký tự' });
    pattern(path.newPassword, /[A-Z]/, { message: 'Mật khẩu cần ít nhất 1 chữ hoa' });
    pattern(path.newPassword, /[0-9]/, { message: 'Mật khẩu cần ít nhất 1 chữ số' });
    pattern(path.newPassword, /[^A-Za-z0-9]/, { message: 'Mật khẩu cần ít nhất 1 ký tự đặc biệt' });

    required(path.confirmNewPassword, { message: 'Vui lòng nhập lại mật khẩu mới' });
  });

  protected readonly changingPassword = signal(false);

  protected async changePassword(event: Event): Promise<void> {
    event.preventDefault();

    const { newPassword, confirmNewPassword } = this.passwordModel();
    if (newPassword !== confirmNewPassword) {
      this.snackBar.open('Mật khẩu mới nhập lại không khớp', 'Đóng', { duration: 4000 });
      return;
    }

    await submit(this.passwordForm, async () => {
      this.changingPassword.set(true);
      try {
        const { currentPassword } = this.passwordModel();
        const res = await firstValueFrom(this.userApi.changePassword(currentPassword, newPassword));
        this.authStore.applySession(res);
        this.passwordForm().reset({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        this.snackBar.open('Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất.', 'Đóng', { duration: 5000 });
      } catch (err) {
        this.snackBar.open(resolveErrorMessage(err, 'Đổi mật khẩu thất bại'), 'Đóng', { duration: 4000 });
      } finally {
        this.changingPassword.set(false);
      }
    });
  }

  // --- Xoá tài khoản ---
  protected readonly deletePassword = signal('');
  protected readonly deletingAccount = signal(false);

  protected confirmDeleteAccount(): void {
    if (!this.deletePassword().trim()) {
      this.snackBar.open('Nhập mật khẩu để xác nhận xoá tài khoản', 'Đóng', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Xoá tài khoản?',
        message: 'Toàn bộ dữ liệu tài khoản sẽ bị xoá vĩnh viễn và không thể khôi phục. Bạn có chắc chắn?',
        confirmText: 'Xoá tài khoản',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      this.deletingAccount.set(true);
      try {
        await firstValueFrom(this.userApi.deleteAccount(this.deletePassword()));
        this.authStore.logout();
        this.snackBar.open('Đã xoá tài khoản', 'Đóng', { duration: 4000 });
        this.router.navigate(['/auth']);
      } catch (err) {
        this.snackBar.open(resolveErrorMessage(err, 'Xoá tài khoản thất bại'), 'Đóng', { duration: 4000 });
      } finally {
        this.deletingAccount.set(false);
      }
    });
  }

}
