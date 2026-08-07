import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecipeStore } from '../stores/recipe-store';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RecipeModel } from '../models';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-recipe-list',
  imports: [MatProgressSpinnerModule, FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatListModule, MatIconModule,],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeList {

  protected readonly resultCount = computed(() => {
    return this.store.filteredRecipes().length;
  });

  protected readonly isSearching = computed(() =>
    this.store.keyword().trim() !== ''
  );

  toggleFavorite(recipe: RecipeModel, event: MouseEvent) {

    event.preventDefault();

    event.stopPropagation();

    this.store.toggleFavorite(recipe.id);

  }

  protected readonly sortType = signal<'asc' | 'desc'>('asc');

  protected readonly sortedRecipes = computed(() => {
    const list = [...this.store.filteredRecipes()];

    return list.sort((a, b) =>
      this.sortType() === 'asc'
        ? a.price - b.price
        : b.price - a.price
    );
  });

  setSort(type: 'asc' | 'desc') {
    this.sortType.set(type);
  }

  protected readonly store = inject(RecipeStore);

  protected readonly recipeDatNhat = computed(() => {

    const recipes = this.store.recipes();

    const giaLonNhat = Math.max(
      ...recipes.map(recipe => recipe.price)
    );

    return recipes.find(recipe => recipe.price === giaLonNhat)!;

  });
}