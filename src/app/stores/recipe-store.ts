import { computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, firstValueFrom, map } from 'rxjs';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { RecipeModel } from '../models';
import { RecipeApiService } from '../services/recipe-api.service';
import { API_BASE_URL } from '../api-base-url';

const RECIPES_URL = `${API_BASE_URL}/recipes`;

// FE-06.3: không gửi request search khi keyword chưa đạt độ dài này (vd gõ 1 ký tự).
export const MIN_KEYWORD_LENGTH = 2;

type RecipeState = {
    keyword: string;
};

export const RecipeStore = signalStore(
    { providedIn: 'root' },

    // Mỗi khoá ở đây tự trở thành một signal chỉ đọc: store.keyword()
    withState<RecipeState>({
        keyword: '',
    }),

    // ─── PROPS: công cụ, không phải state ───────────────────────────
    withProps(() => ({
        /** Server state — toàn bộ danh sách recipe từ backend NestJS (lưu tạm ở service layer). */
        recipesResource: httpResource<RecipeModel[]>(() => RECIPES_URL, { defaultValue: [] }),
    })),

    withComputed((store) => ({
        recipes: computed(() => store.recipesResource.value()),
        isLoading: computed(() => store.recipesResource.isLoading()),
    })),

    // ─── PROPS phụ thuộc keyword: bản đã hoãn của keyword ───────────
    withProps((store) => ({
        /** Bản đã hoãn của keyword: chỉ đổi khi người dùng ngừng gõ 400ms. */
        debouncedKeyword: toSignal(
            toObservable(store.keyword).pipe(
                debounceTime(400), // chờ người dùng ngừng gõ 400ms
                map((k) => k.trim()), // chuẩn hoá: "  Beef " -> "Beef"
                // Chưa đạt độ dài tối thiểu -> coi như rỗng (không search, về lại danh
                // sách đầy đủ) thay vì gửi request cho 1 ký tự đơn lẻ.
                map((k) => (k.length > 0 && k.length < MIN_KEYWORD_LENGTH ? '' : k)),
                distinctUntilChanged(), // giống lần trước thì thôi
            ),
            { initialValue: '' },
        ),
    })),

    withProps((store) => ({
        /** Tìm kiếm được xử lý ở backend NestJS qua GET /recipes?keyword=. */
        searchResource: httpResource<RecipeModel[]>(() => {
            const keyword = store.debouncedKeyword();
            return keyword ? `${RECIPES_URL}?keyword=${encodeURIComponent(keyword)}` : undefined;
        }, { defaultValue: [] }),
    })),

    withComputed((store) => ({
        filteredRecipes: computed(() => {
            return store.debouncedKeyword() ? store.searchResource.value() : store.recipes();
        }),

        isSearchLoading: computed(() => !!store.debouncedKeyword() && store.searchResource.isLoading()),
    })),

    // Nơi DUY NHẤT được đổi state
    withMethods((store) => {
        const recipeApi = inject(RecipeApiService);

        return {
            setKeyword(keyword: string): void {
                patchState(store, { keyword });
            },

            async addRecipe(newRecipe: Omit<RecipeModel, 'id' | 'isFavorite'>): Promise<RecipeModel> {
                const created = await firstValueFrom(recipeApi.create(newRecipe));
                store.recipesResource.reload();
                return created;
            },

            async updateRecipe(id: string, updates: Partial<Omit<RecipeModel, 'id'>>): Promise<void> {
                await firstValueFrom(recipeApi.update(id, updates));
                store.recipesResource.reload();
            },

            async deleteRecipe(id: string): Promise<void> {
                await firstValueFrom(recipeApi.delete(id));
                store.recipesResource.reload();
            },

            getRecipeById(id: string): RecipeModel | undefined {
                return store.recipesResource.value().find((recipe) => recipe.id === id);
            },

            async toggleFavorite(id: string): Promise<void> {
                const recipe = store.recipesResource.value().find((r) => r.id === id);
                if (!recipe) {
                    return;
                }
                const nextIsFavorite = !recipe.isFavorite;
                await firstValueFrom(recipeApi.update(id, { isFavorite: nextIsFavorite }));
                // Cập nhật cục bộ 1 recipe thay vì recipesResource.reload() — reload() bật lại
                // isLoading() và thay nguyên khối recipe-grid bằng spinner "Đang tải danh
                // sách...", trông như cả trang bị tải lại chỉ vì đổi yêu thích 1 món.
                store.recipesResource.update((recipes) =>
                    recipes.map((r) => (r.id === id ? { ...r, isFavorite: nextIsFavorite } : r)),
                );
            },
        };
    }),
);
