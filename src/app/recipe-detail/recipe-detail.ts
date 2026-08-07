import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { toRecipeModel } from '../recipe-mapper';
import { RecipeStore } from '../stores/recipe-store';
import { MealsResponse } from '../models';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-recipe-detail',
  imports: [RouterLink, DecimalPipe, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatDividerModule],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css',
})
export class RecipeDetail {

  private sanitizer = inject(DomSanitizer);

  protected readonly youtubeUrl = computed((): SafeResourceUrl => {

    const url = this.selectedRecipe()?.videoUrl ?? '';

    const id = url.split('v=')[1];

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}`
    );

  });

  private readonly route = inject(ActivatedRoute);

  private readonly store = inject(RecipeStore);

  private readonly params = toSignal(this.route.paramMap);

  // 1. id từ URL — tách riêng ra vì cả hai chỗ dưới đều cần
  private readonly recipeId = computed(() => Number(this.params()?.get('id')));

  // 2. thử local trước
  protected readonly localRecipe = computed(() => {
    return this.store.getRecipeById(this.recipeId());
  });

  // 3. chỉ gọi mạng khi local không có
  protected readonly apiMeal = httpResource<MealsResponse>(() => {
    if (this.localRecipe()) {
      return undefined; // ← có rồi, khỏi gọi
    }
    return `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${this.recipeId()}`;
  });

  protected readonly selectedRecipe = computed(() => {
    if (this.localRecipe()) {
      return this.localRecipe();
    }

    if (!this.apiMeal.hasValue()) {
      return undefined;
    }

    const meal = this.apiMeal.value().meals?.[0];
    if (!meal) {
      return undefined;
    }

    return toRecipeModel(meal);
  });

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

  protected readonly tongTienSauGiam = computed(() => {

    if (this.soPhanAn() >= 5) {
      return this.tongTien() * 0.9;
    }

    return this.tongTien();

  });

  protected readonly tongSoNguyenLieu = computed(() => {

    return this.adjustedIngredients().reduce((tong, ingredient) => {
      return tong + (typeof ingredient.quantity === 'number' ? ingredient.quantity : 0);
    }, 0);

  });

  protected increaseServings() {
    this.soPhanAn.update(n => n + 1);
  }

  protected decreaseServings() {

    if (this.soPhanAn() === 1) {
      return;
    }

    this.soPhanAn.update(n => n - 1);

  }

}