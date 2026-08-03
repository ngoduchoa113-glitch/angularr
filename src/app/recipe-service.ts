import { Injectable, signal } from '@angular/core';
import { RecipeModel } from './models';
import { MOCK_RECIPES } from './mock-recipe';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  private readonly recipesState = signal<RecipeModel[]>(MOCK_RECIPES);

  readonly recipes = this.recipesState.asReadonly();

  getRecipeById(id: number): RecipeModel | undefined {
    return this.recipesState().find((recipe) => recipe.id === id);
  }



}