import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { RecipeStore } from '../stores/recipe-store';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthStore } from '../stores/auth-store';
import { CartStore } from '../stores/cart-store';
import { RecipeCategory } from '../models';

const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  main: 'Món chính',
  dessert: 'Tráng miệng',
  drink: 'Đồ uống',
};

@Component({
  selector: 'app-recipe-detail',
  imports: [RouterLink, DecimalPipe, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatDividerModule, MatProgressSpinnerModule],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css',
})
export class RecipeDetail {

  private sanitizer = inject(DomSanitizer);

  private readonly router = inject(Router);

  private readonly snackBar = inject(MatSnackBar);

  protected readonly authStore = inject(AuthStore);

  protected readonly youtubeUrl = computed((): SafeResourceUrl => {

    const url = this.selectedRecipe()?.videoUrl ?? '';

    const id = url.split('v=')[1];

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}`
    );

  });

  private readonly route = inject(ActivatedRoute);

  private readonly store = inject(RecipeStore);

  private readonly cartStore = inject(CartStore);

  private readonly params = toSignal(this.route.paramMap);

  // id từ URL — tách riêng ra vì cả hai chỗ dưới đều cần
  private readonly recipeId = computed(() => this.params()?.get('id') ?? '');

  protected readonly selectedRecipe = computed(() => {
    return this.store.getRecipeById(this.recipeId());
  });

  // FE-09/10: tránh nháy sai "Không tìm thấy công thức" trong lúc danh sách còn
  // đang tải lần đầu (vd user vào thẳng /recipes/:id hoặc F5 trang chi tiết).
  protected readonly isLoadingRecipes = computed(() => this.store.isLoading());

  protected readonly soPhanAn = signal(1);

  protected readonly adjustedIngredients = computed(() => {

    const recipe = this.selectedRecipe();

    if (!recipe) {
      return [];
    }

    return recipe.ingredients.map(ingredient => ({
      ...ingredient,
      quantity: typeof ingredient.quantity === 'number'
        ? ingredient.quantity * this.soPhanAn()
        : ingredient.quantity,
    }));

  });

  protected readonly tongTien = computed(() => {

    const recipe = this.selectedRecipe();

    if (!recipe) {
      return 0;
    }

    return recipe.price * this.soPhanAn();

  });

  // Giảm giá số lượng (≥5 phần) — xem trước cho khớp với số thật sẽ tính khi xác nhận
  // mua ở giỏ hàng (cart.ts). Ưu đãi reward (bắt chuột...) giờ chỉ áp được ở trang giỏ
  // hàng, vì đó mới là nơi thật sự tạo Order (xem cart.ts) — trang này chỉ thêm vào giỏ.
  protected readonly tongTienSauGiam = computed(() => {
    return this.soPhanAn() >= 5 ? Math.round(this.tongTien() * 0.9) : this.tongTien();
  });

  protected readonly tongSoNguyenLieu = computed(() => {

    return this.adjustedIngredients().reduce((tong, ingredient) => {
      return tong + (typeof ingredient.quantity === 'number' ? ingredient.quantity : 0);
    }, 0);

  });

  protected categoryLabel(category: RecipeCategory): string {
    return CATEGORY_LABELS[category];
  }

  protected increaseServings() {
    this.soPhanAn.update(n => n + 1);
  }

  protected decreaseServings() {

    if (this.soPhanAn() === 1) {
      return;
    }

    this.soPhanAn.update(n => n - 1);

  }

  protected readonly addingToCart = signal(false);

  protected async addToCart(): Promise<void> {
    const recipe = this.selectedRecipe();
    if (!recipe || this.addingToCart()) {
      return;
    }

    this.addingToCart.set(true);
    try {
      await this.cartStore.addItem(recipe.id, this.soPhanAn());
      const snackBarRef = this.snackBar.open('Đã thêm vào giỏ hàng', 'Xem giỏ hàng', { duration: 5000 });
      snackBarRef.onAction().subscribe(() => this.router.navigate(['/cart']));
    } catch (err) {
      const message = err instanceof HttpErrorResponse && typeof err.error?.message === 'string'
        ? err.error.message
        : 'Không thể thêm vào giỏ hàng, thử lại sau';
      this.snackBar.open(message, 'Đóng', { duration: 4000 });
    } finally {
      this.addingToCart.set(false);
    }
  }

}
