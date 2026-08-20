import { Component, inject, signal } from '@angular/core';
import { httpResource, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AdminUserApiService } from '../../services/admin-user-api.service';
import { AuthStore } from '../../stores/auth-store';
import { AuthUser } from '../../models';
import { debouncedKeyword } from '../../shared/debounced-keyword';
import { ConfirmDialog } from '../../confirm-dialog/confirm-dialog';
import { API_BASE_URL } from '../../api-base-url';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

function resolveErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse && typeof err.error?.message === 'string') {
    return err.error.message;
  }
  return fallback;
}

@Component({
  selector: 'app-admin-members',
  imports: [
    FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
  ],
  templateUrl: './admin-members.html',
  styleUrl: './admin-members.css',
})
export class AdminMembers {

  private readonly adminUserApi = inject(AdminUserApiService);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly currentUserId = () => this.authStore.user()?.id;

  // --- Danh sách admin hiện tại (AD-05) ---
  protected readonly adminKeyword = signal('');
  private readonly debouncedAdminKeyword = debouncedKeyword(this.adminKeyword);

  protected readonly adminsResource = httpResource<AuthUser[]>(() => {
    const keyword = this.debouncedAdminKeyword();
    const url = `${API_BASE_URL}/user?role=admin`;
    return keyword ? `${url}&keyword=${encodeURIComponent(keyword)}` : url;
  }, { defaultValue: [] });

  protected readonly revokingId = signal<string | null>(null);

  protected confirmRevoke(user: AuthUser): void {
    const isSelf = user.id === this.currentUserId();
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Thu hồi quyền admin?',
        message: isSelf
          ? `Bạn sẽ tự thu hồi quyền admin của chính mình (${user.email}) và mất quyền truy cập khu vực quản trị. Tiếp tục?`
          : `Thu hồi quyền admin của "${user.email}"? Họ sẽ không còn truy cập được các trang quản trị.`,
        confirmText: 'Thu hồi',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      this.revokingId.set(user.id);
      try {
        await firstValueFrom(this.adminUserApi.revokeAdmin(user.id));
        this.adminsResource.reload();
        this.candidatesResource.reload();
        this.snackBar.open('Đã thu hồi quyền admin', 'Đóng', { duration: 3000 });

        if (isSelf) {
          this.authStore.patchUser({ role: 'user' });
        }
      } catch (err) {
        this.snackBar.open(resolveErrorMessage(err, 'Không thể thu hồi quyền admin'), 'Đóng', { duration: 4000 });
      } finally {
        this.revokingId.set(null);
      }
    });
  }

  // --- Tìm user để cấp quyền admin (AD-06) ---
  protected readonly candidateKeyword = signal('');
  private readonly debouncedCandidateKeyword = debouncedKeyword(this.candidateKeyword);

  protected readonly candidatesResource = httpResource<AuthUser[]>(() => {
    const keyword = this.debouncedCandidateKeyword();
    if (!keyword) {
      return undefined;
    }
    return `${API_BASE_URL}/user?role=user&keyword=${encodeURIComponent(keyword)}`;
  }, { defaultValue: [] });

  protected readonly grantingId = signal<string | null>(null);

  protected async grantAdmin(user: AuthUser): Promise<void> {
    this.grantingId.set(user.id);
    try {
      await firstValueFrom(this.adminUserApi.grantAdmin(user.id));
      this.candidatesResource.reload();
      this.adminsResource.reload();
      this.snackBar.open(`Đã cấp quyền admin cho ${user.email}`, 'Đóng', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(resolveErrorMessage(err, 'Không thể cấp quyền admin'), 'Đóng', { duration: 4000 });
    } finally {
      this.grantingId.set(null);
    }
  }

}
