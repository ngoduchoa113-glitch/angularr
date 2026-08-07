import { Component, inject, signal } from '@angular/core';
import { form, submit, FormField, required, email } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { RecipeModel } from '../models';
import { RecipeStore } from '../stores/recipe-store';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-recipe',
  imports: [FormField, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCardModule],
  templateUrl: './add-recipe.html',
  styleUrl: './add-recipe.css',
})
export class AddRecipe {

  private readonly store = inject(RecipeStore);
  private readonly router = inject(Router);

  protected readonly recipeModel = signal({
    name: '',
    description: '',
    authorEmail: '',
  });

  protected readonly recipeForm = form(this.recipeModel, (path) => {
    required(path.name, { message: 'Tên không được bỏ trống' }),
      required(path.description, { message: 'Mô tả không được bỏ trống' }),
      required(path.authorEmail, { message: 'Email tác giả không được bỏ trống' }),
      email(path.authorEmail, { message: 'Email không hợp lệ' })
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();

    const ok = await submit(this.recipeForm, async () => {
      const { name, description, authorEmail } = this.recipeModel();

      const newRecipe: RecipeModel = {
        id: this.nextId(),
        name,
        description,
        authorEmail,
        price: 100000,
        ingredients: [],
        isFavorite: false,
        imgUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      };

      this.store.addRecipe(newRecipe);
    });

    if (ok) {
      this.router.navigate(['/recipes', this.nextId() - 1]);
    }
  }

  private nextId(): number {
    const ids = this.store.recipes().map((recipe) => recipe.id);
    return Math.max(...ids, 0) + 1;
  }



}
