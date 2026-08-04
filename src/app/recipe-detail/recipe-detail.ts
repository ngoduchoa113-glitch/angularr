import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { RecipeService } from '../recipe-service';

@Component({
  selector: 'app-recipe-detail',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css',
})
export class RecipeDetail {

  private readonly route = inject(ActivatedRoute);

  private readonly recipeService = inject(RecipeService);

  private readonly params = toSignal(this.route.paramMap);

  protected readonly selectedRecipe = computed(() => {

    const id = Number(this.params()?.get('id'));

    return this.recipeService.getRecipeById(id);

  });

  protected readonly soPhanAn = signal(1);

  protected readonly adjustedIngredients = computed(() => {

    const recipe = this.selectedRecipe();

    if (!recipe) {
      return [];
    }

    return recipe.ingredients.map(ingredient => ({
      ...ingredient,
      quantity: ingredient.quantity * this.soPhanAn(),
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
      return tong + ingredient.quantity;
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