import { computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { signalStore, withComputed, withMethods, withProps } from '@ngrx/signals';
import { OrderModel } from '../models';
import { OrderApiService } from '../services/order-api.service';
import { API_BASE_URL } from '../api-base-url';

const ORDERS_URL = `${API_BASE_URL}/orders`;

export const OrderStore = signalStore(
    { providedIn: 'root' },

    withProps(() => ({
        ordersResource: httpResource<OrderModel[]>(() => ORDERS_URL, { defaultValue: [] }),
    })),

    withComputed((store) => ({
        orders: computed(() => store.ordersResource.value()),
        isLoading: computed(() => store.ordersResource.isLoading()),
    })),

    withMethods((store) => {
        const orderApi = inject(OrderApiService);

        return {
            async createOrder(recipeId: string, servings: number, rewardId?: string): Promise<OrderModel> {
                const created = await firstValueFrom(orderApi.create(recipeId, servings, rewardId));
                store.ordersResource.reload();
                return created;
            },

            async updateOrder(id: string, servings: number): Promise<void> {
                await firstValueFrom(orderApi.update(id, servings));
                store.ordersResource.reload();
            },

            async cancelOrder(id: string): Promise<void> {
                await firstValueFrom(orderApi.cancel(id));
                store.ordersResource.reload();
            },
        };
    }),
);
