import { Component, signal, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecipeStore } from '../stores/recipe-store';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RecipeModel } from '../models';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-recipe-list',
  imports: [DecimalPipe, MatProgressSpinnerModule, FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDividerModule],
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

  protected readonly sortType = signal<'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('price-asc');

  protected readonly showFavoritesOnly = signal(false);

  protected readonly sortedRecipes = computed(() => {
    const favoritesOnly = this.showFavoritesOnly();
    const list = this.store.filteredRecipes().filter((recipe) => !favoritesOnly || recipe.isFavorite);

    const sorted = [...list];

    switch (this.sortType()) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
    }
  });

  setSort(type: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc') {
    this.sortType.set(type);
  }

  toggleFavoritesOnly() {
    this.showFavoritesOnly.update((value) => !value);
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