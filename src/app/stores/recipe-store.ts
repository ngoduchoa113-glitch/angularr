import { computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { MealsResponse, RecipeModel } from '../models';
import { MOCK_RECIPES } from '../mock-recipe';
import { toRecipeModel } from '../recipe-mapper';

const SEARCH_URL = 'https://www.themealdb.com/api/json/v1/1/search.php';

type RecipeState = {
    recipes: RecipeModel[];
    keyword: string;
};

export const RecipeStore = signalStore(
    { providedIn: 'root' },

    // Mỗi khoá ở đây tự trở thành một signal chỉ đọc: store.recipes(), store.keyword()
    withState<RecipeState>({
        recipes: MOCK_RECIPES,
        keyword: '',
    }),

    // State dẫn xuất — giống computed() thường, chỉ là đặt đúng chỗ
    withComputed((store) => ({
        filteredRecipes: computed(() => {
            const key = store.keyword().toLowerCase().trim();
            const all = store.recipes();
            if (key === '') {
                return all;
            }
            return all.filter((recipe) => recipe.name.toLowerCase().includes(key));
        }),
    })),

    // ─── PROPS: công cụ, không phải state ───────────────────────────
    withProps((store) => ({
        /** Bản đã hoãn của keyword: chỉ đổi khi người dùng ngừng gõ 400ms. */
        debouncedKeyword: toSignal(
            toObservable(store.keyword).pipe(
                debounceTime(400), // chờ người dùng ngừng gõ 400ms
                map((k) => k.trim().toLowerCase()), // chuẩn hoá: "  Beef " -> "beef"
                distinctUntilChanged(), // giống lần trước thì thôi
                filter((k) => k.length !== 1), // 1 ký tự = đang gõ dở, chưa gọi
            ),
            { initialValue: '' },
        ),
    })),

    withProps((store) => ({
        /** Server state — bản sao dữ liệu của TheMealDB, không nằm trong withState. */
        meals: httpResource<MealsResponse>(() => `${SEARCH_URL}?s=${store.debouncedKeyword()}`),
    })),

    // State dẫn xuất từ meals — chuyển hình dạng TheMealDB sang RecipeModel
    withComputed((store) => ({
        apiRecipes: computed<RecipeModel[]>(() => {
            if (!store.meals.hasValue()) {
                return [];
            }
            const list = store.meals.value()?.meals ?? [];
            return list.map((meal) => toRecipeModel(meal));
        }),
    })),

    // Nơi DUY NHẤT được đổi state
    withMethods((store) => ({
        setKeyword(keyword: string): void {
            patchState(store, { keyword });
        },

        addRecipe(newRecipe: RecipeModel): void {
            patchState(store, (state) => ({ recipes: [...state.recipes, newRecipe] }));
        },

        updateRecipe(id: number, updates: Omit<RecipeModel, 'id' | 'isFavorite'>): void {
            patchState(store, (state) => ({
                recipes: state.recipes.map((recipe) =>
                    recipe.id === id ? { ...recipe, ...updates } : recipe
                ),
            }));
        },

        deleteRecipe(id: number): void {
            patchState(store, (state) => ({
                recipes: state.recipes.filter((recipe) => recipe.id !== id),
            }));
        },

        getRecipeById(id: number): RecipeModel | undefined {
            return store.recipes().find((recipe) => recipe.id === id);
        },

        toggleFavorite(id: number): void {
            patchState(store, (state) => ({
                recipes: state.recipes.map((recipe) =>
                    recipe.id === id ? { ...recipe, isFavorite: !recipe.isFavorite } : recipe
                ),
            }));
        },
    })),
);