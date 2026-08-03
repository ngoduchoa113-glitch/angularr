import { Component, signal, computed, inject } from '@angular/core';
import { RecipeModel } from '../models';
import { RecipeDetail } from '../recipe-detail/recipe-detail';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../recipe-service';

@Component({
  selector: 'app-recipe-list',
  imports: [RecipeDetail, FormsModule],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeList {

  private readonly recipeService = inject(RecipeService);

  protected readonly selectedRecipe = signal<RecipeModel>(
    this.recipeService.recipes()[0]
  );

  protected readonly searchText = signal('');

  protected chonMon(recipe: RecipeModel): void {
    this.selectedRecipe.set(recipe);
  }

  protected readonly filteredRecipes = computed(() => {

    const keyword = this.searchText()
      .trim()
      .toLowerCase();

    const all = this.recipeService.recipes();

    return all.filter(recipe =>
      recipe.name
        .toLowerCase()
        .includes(keyword)
    );

  });


  protected readonly recipeDatNhat = computed(() => {

    const recipes = this.recipeService.recipes();

    const giaLonNhat = Math.max(
      ...recipes.map(recipe => recipe.price)
    );

    return recipes.find(recipe => recipe.price === giaLonNhat)!;

  });
}