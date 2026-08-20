import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { form, submit, FormField, required, email, min, max, minLength, pattern, applyEach } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RecipeCategory, RecipeModel } from '../../models';
import { RecipeStore } from '../../stores/recipe-store';
import { UploadApiService } from '../../services/upload-api.service';
import { resolveImageError } from '../../services/resolve-image-error';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

const MIN_PRICE = 1000;
const MAX_PRICE = 9_999_999_999; // dưới 10 tỷ
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const UNIT_NO_DIGITS_PATTERN = /^\D*$/;

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

// <input type="number"> vẫn cho gõ e/E (ký hiệu khoa học, "1e5" = 100000) và +/-
// dù number step="1000" luôn dương — chặn thẳng các phím này ở bàn phím.
const BLOCKED_NUMBER_KEYS = new Set(['e', 'E', '+', '-']);

export const CATEGORY_OPTIONS: { value: RecipeCategory; label: string }[] = [
  { value: 'main', label: 'Món chính' },
  { value: 'dessert', label: 'Tráng miệng' },
  { value: 'drink', label: 'Đồ uống' },
];

function emptyRecipeModel() {
  return {
    name: '',
    description: '',
    authorEmail: '',
    category: null as RecipeCategory | null,
    price: null as number | null,
    imgUrl: '',
    ingredients: [{ name: '', quantity: null as number | null, unit: '' }],
  };
}

function recipeToFormModel(recipe: RecipeModel | undefined) {
  if (!recipe) {
    return emptyRecipeModel();
  }

  const ingredients = recipe.ingredients.length > 0
    ? recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: typeof ingredient.quantity === 'number' ? ingredient.quantity : (Number(ingredient.quantity) || null),
      unit: ingredient.unit,
    }))
    : [{ name: '', quantity: null as number | null, unit: '' }];

  return {
    name: recipe.name,
    description: recipe.description,
    authorEmail: recipe.authorEmail ?? '',
    category: recipe.category,
    price: recipe.price as number | null,
    imgUrl: recipe.imgUrl,
    ingredients,
  };
}

// AD-08/09: form tạo/sửa recipe — sống trong khu vực /admin, tách bạch khỏi mọi
// trang xem/đặt món phía user (RecipeList/RecipeDetail không import component này).
@Component({
  selector: 'app-admin-recipe-form',
  imports: [
    FormField, RouterLink, DecimalPipe,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatCardModule, MatListModule, MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-recipe-form.html',
  styleUrl: './admin-recipe-form.css',
})
export class AdminRecipeForm {

  private readonly store = inject(RecipeStore);
  private readonly uploadApi = inject(UploadApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly editingId = this.route.snapshot.paramMap.get('id');

  protected readonly isEditMode = this.editingId !== null;

  protected readonly recipeModel = signal(emptyRecipeModel());

  protected readonly categoryOptions = CATEGORY_OPTIONS;

  // FE-09/10: nếu vào thẳng URL sửa (hoặc F5) mà RecipeStore chưa từng tải, danh
  // sách còn rỗng lúc component khởi tạo — không đọc getRecipeById() một lần ở đây
  // (sẽ ra rỗng), mà chờ store tải xong rồi mới đổ dữ liệu vào form.
  protected readonly isLoadingRecipe = signal(this.isEditMode);
  protected readonly recipeNotFound = signal(false);

  constructor() {
    if (this.editingId === null) {
      return;
    }

    let populated = false;
    effect(() => {
      if (populated) {
        return;
      }

      const recipe = this.store.getRecipeById(this.editingId!);
      if (recipe) {
        this.recipeModel.set(recipeToFormModel(recipe));
        populated = true;
        this.isLoadingRecipe.set(false);
      } else if (!this.store.isLoading()) {
        // Đã tải xong toàn bộ danh sách nhưng không có recipe với id này.
        populated = true;
        this.isLoadingRecipe.set(false);
        this.recipeNotFound.set(true);
      }
    });
  }

  protected readonly previewRecipe = computed(() => {
    const model = this.recipeModel();

    return {
      name: model.name.trim(),
      description: model.description.trim(),
      price: model.price,
      imgUrl: model.imgUrl.trim(),
      ingredients: model.ingredients.filter((ingredient) => ingredient.name.trim() !== ''),
    };
  });

  protected readonly recipeForm = form(this.recipeModel, (path) => {
    required(path.name, { message: 'Tên không được bỏ trống' });
    required(path.description, { message: 'Mô tả không được bỏ trống' });
    required(path.authorEmail, { message: 'Email tác giả không được bỏ trống' });
    email(path.authorEmail, { message: 'Email không hợp lệ' });

    required(path.category, { message: 'Cần chọn 1 tag cho món ăn' });

    required(path.price, { message: 'Giá không được bỏ trống' });
    min(path.price, MIN_PRICE, { message: `Giá thấp nhất là ${MIN_PRICE.toLocaleString('vi-VN')}đ` });
    max(path.price, MAX_PRICE, { message: 'Giá phải dưới 10 tỷ' });

    required(path.imgUrl, { message: 'Cần có hình ảnh' });

    minLength(path.ingredients, 1, { message: 'Cần ít nhất một nguyên liệu' });

    applyEach(path.ingredients, (ingredient) => {
      required(ingredient.name, { message: 'Không được bỏ trống' });
      required(ingredient.quantity, { message: 'Bắt buộc' });
      min(ingredient.quantity, 1, { message: 'giá phải lớn hơn 0' });
      required(ingredient.unit, { message: 'Bắt buộc (chữ)' });
      pattern(ingredient.unit, UNIT_NO_DIGITS_PATTERN, { message: 'Không được chứa số' });
    });
  });

  protected blockInvalidNumberKey(event: KeyboardEvent): void {
    if (BLOCKED_NUMBER_KEYS.has(event.key)) {
      event.preventDefault();
    }
  }

  protected readonly uploadingImage = signal(false);

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // cho phép chọn lại đúng file đó lần sau vẫn bắn sự kiện change

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Chỉ chấp nhận file ảnh', 'Đóng', { duration: 3000 });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.snackBar.open('Ảnh tối đa 5MB', 'Đóng', { duration: 3000 });
      return;
    }

    this.uploadingImage.set(true);
    try {
      const { url } = await firstValueFrom(this.uploadApi.uploadImage(file));
      this.recipeModel.update((model) => ({ ...model, imgUrl: url }));
    } catch (err) {
      this.snackBar.open(resolveImageError(err, 'Tải ảnh thất bại, thử lại sau'), 'Đóng', { duration: 4000 });
    } finally {
      this.uploadingImage.set(false);
    }
  }

  protected readonly checkingUrl = signal(false);

  // Image Moderation: URL admin gõ tay phải qua bước này trước khi có thể lưu công thức
  // — backend fetch (chống SSRF) + kiểm duyệt + tải về lưu nội bộ, trả về 1 URL nội bộ
  // mới thay cho URL ngoài (xem uploads.controller.ts#uploadFromUrl). recipeModel.imgUrl
  // chỉ được service tạo/sửa recipe chấp nhận khi là URL nội bộ dạng này.
  protected async checkImageUrl(): Promise<void> {
    const url = this.recipeModel().imgUrl.trim();
    if (!url) {
      this.snackBar.open('Nhập URL ảnh trước khi kiểm tra', 'Đóng', { duration: 3000 });
      return;
    }

    this.checkingUrl.set(true);
    try {
      const { url: verifiedUrl } = await firstValueFrom(this.uploadApi.moderateUrl(url));
      this.recipeModel.update((model) => ({ ...model, imgUrl: verifiedUrl }));
      this.snackBar.open('Đã kiểm tra và duyệt ảnh từ URL', 'Đóng', { duration: 3000 });
    } catch (err) {
      this.snackBar.open(resolveImageError(err, 'Không thể kiểm tra URL này, thử lại sau'), 'Đóng', { duration: 4000 });
    } finally {
      this.checkingUrl.set(false);
    }
  }

  protected addIngredient(): void {
    this.recipeModel.update((model) => ({
      ...model,
      ingredients: [...model.ingredients, { name: '', quantity: null, unit: '' }],
    }));
  }

  protected removeIngredient(index: number): void {
    this.recipeModel.update((model) => ({
      ...model,
      ingredients: model.ingredients.filter((_, i) => i !== index),
    }));
  }

  protected readonly formError = signal<string | null>(null);

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    this.formError.set(null);

    let addedId: string | null = null;

    const ok = await submit(this.recipeForm, async () => {
      const { name, description, authorEmail, category, price, imgUrl, ingredients } = this.recipeModel();

      const recipeData: Omit<RecipeModel, 'id' | 'isFavorite'> = {
        name,
        description,
        authorEmail,
        category: category!,
        price: price!,
        ingredients: ingredients.map((ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          measure: `${ingredient.quantity} ${ingredient.unit}`.trim(),
        })),
        imgUrl: imgUrl.trim(),
      };

      try {
        if (this.editingId !== null) {
          await this.store.updateRecipe(this.editingId, recipeData);
        } else {
          const created = await this.store.addRecipe(recipeData);
          addedId = created.id;
        }
      } catch (err) {
        // Ví dụ: imgUrl không phải URL nội bộ đã qua kiểm duyệt (bấm "Kiểm tra & dùng URL
        // này"/"Tải ảnh từ máy" trước khi lưu) — recipe.service.ts chặn ở backend.
        this.formError.set(resolveImageError(err, resolveErrorMessage(err, 'Không thể lưu công thức, thử lại sau')));
      }
    });

    const error = this.formError();
    if (!ok || error) {
      if (error) {
        this.snackBar.open(error, 'Đóng', { duration: 4000 });
      }
      return;
    }

    if (this.editingId !== null) {
      this.snackBar.open('Đã cập nhật công thức', 'Đóng', { duration: 3000 });
      this.router.navigate(['/admin/recipes']);
    } else {
      this.recipeForm().reset(emptyRecipeModel());

      const snackBarRef = this.snackBar.open('Đã thêm công thức thành công', 'Xem món vừa thêm', { duration: 5000 });
      snackBarRef.onAction().subscribe(() => {
        this.router.navigate(['/recipes', addedId]);
      });
    }
  }

}
