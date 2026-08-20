import { Component, inject, signal } from '@angular/core';
import { httpResource, HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecipeStore } from '../../stores/recipe-store';
import { RecipeModel } from '../../models';
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

// AD-08/09: trang quản trị recipe riêng biệt — KHÔNG import RecipeList/RecipeDetail
// (trang xem của user). Tự có resource + state tìm kiếm riêng (không dùng
// store.keyword/searchResource) để không rò rỉ từ khoá tìm kiếm qua lại giữa khu
// vực admin và khu vực user — nhưng vẫn gọi RecipeStore.deleteRecipe() (không gọi
// thẳng RecipeApiService) để cache recipesResource dùng chung cũng được làm mới.
@Component({
  selector: 'app-admin-recipes',
  imports: [
    DecimalPipe, RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
  ],
  templateUrl: './admin-recipes.html',
  styleUrl: './admin-recipes.css',
})
export class AdminRecipes {

  private readonly recipeStore = inject(RecipeStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly keyword = signal('');
  private readonly debouncedSearchKeyword = debouncedKeyword(this.keyword);

  protected readonly recipesResource = httpResource<RecipeModel[]>(() => {
    const kw = this.debouncedSearchKeyword();
    const url = `${API_BASE_URL}/recipes`;
    return kw ? `${url}?keyword=${encodeURIComponent(kw)}` : url;
  }, { defaultValue: [] });

  protected readonly deletingId = signal<string | null>(null);

  protected confirmDelete(recipe: RecipeModel): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Xoá công thức?',
        message: `Bạn có chắc muốn xoá "${recipe.name}"? Hành động này không thể hoàn tác.`,
        confirmText: 'Xoá',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) {
        return;
      }

      this.deletingId.set(recipe.id);
      try {
        await this.recipeStore.deleteRecipe(recipe.id);
        this.recipesResource.reload();
        this.snackBar.open('Đã xoá công thức', 'Đóng', { duration: 3000 });
      } catch (err) {
        this.snackBar.open(resolveErrorMessage(err, 'Không thể xoá công thức'), 'Đóng', { duration: 4000 });
      } finally {
        this.deletingId.set(null);
      }
    });
  }

}
