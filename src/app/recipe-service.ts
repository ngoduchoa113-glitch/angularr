import { Injectable, signal } from '@angular/core';
import { RecipeModel } from './models';
import { MOCK_RECIPES } from './mock-recipe';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  private readonly recipesState = signal<RecipeModel[]>(MOCK_RECIPES);

  toggleFavorite(id: number): void {
    this.recipesState.update(recipes =>
      recipes.map(recipe =>
        recipe.id === id
          ? {
            ...recipe,
            isFavorite: !recipe.isFavorite
          }
          : recipe
      )
    );
  }

  readonly recipes = this.recipesState.asReadonly();

  getRecipeById(id: number): RecipeModel | undefined {
    return this.recipesState().find((recipe) => recipe.id === id);
  }

  addRecipe(newRecipe: RecipeModel): void {
    this.recipesState.update((current) => [...current, newRecipe]);
  }

}