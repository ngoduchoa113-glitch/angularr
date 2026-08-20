import { Component, signal, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecipeStore, MIN_KEYWORD_LENGTH } from '../stores/recipe-store';
import { AuthStore } from '../stores/auth-store';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { RecipeCategory, RecipeModel } from '../models';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MascotBus } from '../services/mascot-bus';

type SortType = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

@Component({
  selector: 'app-recipe-list',
  imports: [DecimalPipe, MatProgressSpinnerModule, FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatMenuModule, MatDividerModule],
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

  protected readonly minKeywordLength = MIN_KEYWORD_LENGTH;

  // Đã gõ gì đó nhưng chưa đạt độ dài tối thiểu (FE-06.3) -> chưa có request nào
  // được gửi, không nên hiển thị "Tìm thấy N món" (sẽ là số của toàn bộ danh sách).
  protected readonly belowMinLength = computed(() => {
    const trimmed = this.store.keyword().trim();
    return trimmed.length > 0 && trimmed.length < MIN_KEYWORD_LENGTH;
  });

  private readonly mascotBus = inject(MascotBus);

  toggleFavorite(recipe: RecipeModel, event: MouseEvent) {

    event.preventDefault();

    event.stopPropagation();

    // Chỉ ăn mừng khi BẬT yêu thích (không phải khi bỏ yêu thích) — đọc isFavorite
    // trước khi gọi toggle, vì toggle là async và chưa cập nhật state ngay tại đây.
    if (!recipe.isFavorite) {
      this.mascotBus.notifyFavorited();
    }

    this.store.toggleFavorite(recipe.id);

  }

  protected readonly sortType = signal<SortType>('price-asc');

  protected readonly sortOptions: { value: SortType; label: string }[] = [
    { value: 'price-asc', label: '↑ Giá tăng' },
    { value: 'price-desc', label: '↓ Giá giảm' },
    { value: 'name-asc', label: 'A→Z' },
    { value: 'name-desc', label: 'Z→A' },
  ];

  protected readonly sortLabel = computed(() => {
    return this.sortOptions.find((option) => option.value === this.sortType())!.label;
  });

  protected readonly showFavoritesOnly = signal(false);

  protected readonly categoryFilter = signal<RecipeCategory | 'all'>('all');

  protected readonly categoryOptions: { value: RecipeCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'main', label: 'Món chính' },
    { value: 'dessert', label: 'Tráng miệng' },
    { value: 'drink', label: 'Đồ uống' },
  ];

  private readonly categoryLabels: Record<RecipeCategory, string> = {
    main: 'Món chính',
    dessert: 'Tráng miệng',
    drink: 'Đồ uống',
  };

  protected categoryLabel(category: RecipeCategory): string {
    return this.categoryLabels[category];
  }

  protected readonly categoryTriggerLabel = computed(() => {
    return this.categoryOptions.find((option) => option.value === this.categoryFilter())!.label;
  });

  protected readonly emptyStateMessage = computed(() => {
    if (this.showFavoritesOnly()) {
      return 'Chưa có món yêu thích nào.';
    }
    if (this.categoryFilter() !== 'all') {
      return `Chưa có món nào trong mục "${this.categoryLabel(this.categoryFilter() as RecipeCategory)}".`;
    }
    return 'Không tìm thấy món nào.';
  });

  protected readonly sortedRecipes = computed(() => {
    const favoritesOnly = this.showFavoritesOnly();
    const category = this.categoryFilter();
    const list = this.store.filteredRecipes()
      .filter((recipe) => !favoritesOnly || recipe.isFavorite)
      .filter((recipe) => category === 'all' || recipe.category === category);

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

  setSort(type: SortType) {
    this.sortType.set(type);
  }

  toggleFavoritesOnly() {
    this.showFavoritesOnly.update((value) => !value);
  }

  setCategoryFilter(category: RecipeCategory | 'all') {
    this.categoryFilter.set(category);
  }

  protected readonly store = inject(RecipeStore);

  protected readonly authStore = inject(AuthStore);

  protected readonly recipeDatNhat = computed(() => {

    const recipes = this.store.recipes();

    const giaLonNhat = Math.max(
      ...recipes.map(recipe => recipe.price)
    );

    return recipes.find(recipe => recipe.price === giaLonNhat)!;

  });
}