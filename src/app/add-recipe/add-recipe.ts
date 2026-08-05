import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RecipeModel } from '../models';
import { RecipeService } from '../recipe-service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-add-recipe',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCardModule],
  templateUrl: './add-recipe.html',
  styleUrl: './add-recipe.css',
})
export class AddRecipe {

  private readonly fb = inject(FormBuilder);
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);

  protected readonly recipeForm = this.fb.group({
    name: ['', Validators.required],
    price: [null, [Validators.required, Validators.min(1)]],
    videoUrl: [''],
    description: ['', Validators.required],
    ingredients: ['', Validators.required],
    imgUrl: [''],
  });

  protected save(): void {
    if (this.recipeForm.invalid) {
      this.recipeForm.markAllAsTouched();
      return;
    }

    const currentRecipes = this.recipeService.recipes();
    const nextId = Math.max(...currentRecipes.map((recipe) => recipe.id), 0) + 1;

    const newRecipe: RecipeModel = {
      id: nextId,
      name: this.recipeForm.value.name!,
      price: this.recipeForm.value.price!,
      description: this.recipeForm.value.description!,
      imgUrl:
        this.recipeForm.value.imgUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      isFavorite: false,
      ingredients: [
        {
          name: this.recipeForm.value.ingredients!,
          quantity: 1,
          unit: 'cái',
        },
      ],
    };

    this.recipeService.addRecipe(newRecipe);
    this.router.navigate(['/recipes']);
  }

}