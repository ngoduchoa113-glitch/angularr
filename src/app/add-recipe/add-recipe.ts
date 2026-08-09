import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { form, submit, FormField, required, email, min, minLength, applyEach } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipeModel } from '../models';
import { RecipeStore } from '../stores/recipe-store';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

const MIN_PRICE = 1000;

function emptyRecipeModel() {
  return {
    name: '',
    description: '',
    authorEmail: '',
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
    price: recipe.price as number | null,
    imgUrl: recipe.imgUrl,
    ingredients,
  };
}

@Component({
  selector: 'app-add-recipe',
  imports: [
    FormField, RouterLink, DecimalPipe,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCardModule, MatListModule, MatDividerModule,
  ],
  templateUrl: './add-recipe.html',
  styleUrl: './add-recipe.css',
})
export class AddRecipe {

  private readonly store = inject(RecipeStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly editingId = this.route.snapshot.paramMap.has('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;

  protected readonly isEditMode = this.editingId !== null;

  protected readonly recipeModel = signal(
    this.editingId !== null
      ? recipeToFormModel(this.store.getRecipeById(this.editingId))
      : emptyRecipeModel()
  );

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

    required(path.price, { message: 'Giá không được bỏ trống' });
    min(path.price, MIN_PRICE, { message: `Giá thấp nhất là ${MIN_PRICE.toLocaleString('vi-VN')}đ` });

    minLength(path.ingredients, 1, { message: 'Cần ít nhất một nguyên liệu' });

    applyEach(path.ingredients, (ingredient) => {
      required(ingredient.name, { message: 'Bắt buộc' });
      required(ingredient.quantity, { message: 'Bắt buộc' });
      min(ingredient.quantity, 1, { message: '> 0' });
      required(ingredient.unit, { message: 'Bắt buộc' });
    });
  });

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

  protected async save(event: Event): Promise<void> {
    event.preventDefault();

    let addedId: number | null = null;

    const ok = await submit(this.recipeForm, async () => {
      const { name, description, authorEmail, price, imgUrl, ingredients } = this.recipeModel();

      const recipeData: Omit<RecipeModel, 'id' | 'isFavorite'> = {
        name,
        description,
        authorEmail,
        price: price!,
        ingredients: ingredients.map((ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          measure: `${ingredient.quantity} ${ingredient.unit}`.trim(),
        })),
        imgUrl: imgUrl.trim(),
      };

      if (this.editingId !== null) {
        this.store.updateRecipe(this.editingId, recipeData);
      } else {
        addedId = this.nextId();
        this.store.addRecipe({ id: addedId, isFavorite: false, ...recipeData });
      }
    });

    if (!ok) {
      return;
    }

    if (this.editingId !== null) {
      this.snackBar.open('Đã cập nhật công thức', 'Đóng', { duration: 3000 });
      this.router.navigate(['/recipes', this.editingId]);
    } else {
      this.recipeForm().reset(emptyRecipeModel());

      const snackBarRef = this.snackBar.open('Đã thêm công thức thành công', 'Xem món vừa thêm', { duration: 5000 });
      snackBarRef.onAction().subscribe(() => {
        this.router.navigate(['/recipes', addedId]);
      });
    }
  }

  private nextId(): number {
    const ids = this.store.recipes().map((recipe) => recipe.id);
    return Math.max(...ids, 0) + 1;
  }



}
