import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'recipes', loadComponent: () => import('./recipe-list/recipe-list').then((m) => m.RecipeList) },
    { path: 'recipes/new', loadComponent: () => import('./add-recipe/add-recipe').then((m) => m.AddRecipe) },
    { path: 'recipes/:id', loadComponent: () => import('./recipe-detail/recipe-detail').then((m) => m.RecipeDetail) },
    { path: '', redirectTo: 'recipes', pathMatch: 'full' },
];