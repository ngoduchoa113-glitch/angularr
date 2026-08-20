import { computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { signalStore, withComputed, withMethods, withProps } from '@ngrx/signals';
import { CartItemModel, OrderModel } from '../models';
import { CartApiService } from '../services/cart-api.service';
import { API_BASE_URL } from '../api-base-url';

const CART_URL = `${API_BASE_URL}/cart`;

export const CartStore = signalStore(
    { providedIn: 'root' },

    withProps(() => ({
        cartResource: httpResource<CartItemModel[]>(() => CART_URL, { defaultValue: [] }),
    })),

    withComputed((store) => ({
        items: computed(() => store.cartResource.value()),
        isLoading: computed(() => store.cartResource.isLoading()),
        // Dùng cho badge số lượng ở sidebar — đếm số DÒNG trong giỏ (số món khác nhau),
        // không phải tổng số phần ăn, giống quy ước phổ biến của giỏ hàng.
        itemCount: computed(() => store.cartResource.value().length),
    })),

    withMethods((store) => {
        const cartApi = inject(CartApiService);

        return {
            async addItem(recipeId: string, servings: number): Promise<void> {
                await firstValueFrom(cartApi.addItem(recipeId, servings));
                store.cartResource.reload();
            },

            async updateServings(id: string, servings: number): Promise<void> {
                await firstValueFrom(cartApi.updateServings(id, servings));
                store.cartResource.reload();
            },

            async removeItem(id: string): Promise<void> {
                await firstValueFrom(cartApi.removeItem(id));
                store.cartResource.reload();
            },

            async checkout(itemIds: string[], rewardId?: string): Promise<OrderModel[]> {
                const orders = await firstValueFrom(cartApi.checkout(itemIds, rewardId));
                store.cartResource.reload();
                return orders;
            },
        };
    }),
);
