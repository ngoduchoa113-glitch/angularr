import { Routes } from '@angular/router';
import { RecipeList } from './recipe-list/recipe-list';
import { RecipeDetail } from './recipe-detail/recipe-detail';
import { AddRecipe } from './add-recipe/add-recipe';

export const routes: Routes = [
    { path: 'recipes', component: RecipeList },
    { path: 'recipes/new', component: AddRecipe },
    { path: 'recipes/:id', component: RecipeDetail },
    { path: '', redirectTo: 'recipes', pathMatch: 'full' },
];