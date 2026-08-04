import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../recipe-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recipe-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeList {

  protected readonly resultCount = computed(() => {
    return this.filteredRecipes().length;
  });

  protected readonly isSearching = computed(() =>
    this.searchText().trim() !== ''
  );

  protected readonly sortType = signal<'asc' | 'desc'>('asc');

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

  protected readonly sortedRecipes = computed(() => {
    const list = [...this.filteredRecipes()];

    return list.sort((a, b) =>
      this.sortType() === 'asc'
        ? a.price - b.price
        : b.price - a.price
    );
  });

  setSort(type: 'asc' | 'desc') {
    this.sortType.set(type);
  }

  public readonly recipeService = inject(RecipeService);

  protected readonly searchText = signal('');

  protected readonly recipeDatNhat = computed(() => {

    const recipes = this.recipeService.recipes();

    const giaLonNhat = Math.max(
      ...recipes.map(recipe => recipe.price)
    );

    return recipes.find(recipe => recipe.price === giaLonNhat)!;

  });
}