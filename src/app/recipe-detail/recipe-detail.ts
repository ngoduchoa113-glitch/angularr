import { Component, computed, input, signal } from '@angular/core';
import { RecipeModel } from '../models';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-recipe-detail',
  imports: [DecimalPipe],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css'
})
export class RecipeDetail {

  readonly recipe = input.required<RecipeModel>();

  protected readonly soPhanAn = signal(1);

  protected readonly tongTien = computed(() => {
    return this.recipe().price * this.soPhanAn();
  });

  protected readonly tongTienSauGiam = computed(() => {
    const tongTien = this.tongTien();

    if (this.soPhanAn() >= 5) {
      return tongTien * 0.9;
    }

    return tongTien;
  });

  protected readonly adjustedIngredients = computed(() => {
    const recipe = this.recipe();
    const soPhanAn = this.soPhanAn();

    return recipe.ingredients.map(ingredient => {
      return {
        name: ingredient.name,
        quantity: ingredient.quantity * soPhanAn,
        unit: ingredient.unit,
      };
    });
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