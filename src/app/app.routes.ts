import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

// FE-11: mỗi route tải component riêng theo yêu cầu (code-splitting) thay vì gộp
// toàn bộ app vào 1 bundle ban đầu.
export const routes: Routes = [
  { path: '', redirectTo: 'recipes', pathMatch: 'full' },
  { path: 'auth', loadComponent: () => import('./auth/auth').then((m) => m.Auth) },
  { path: 'profile', loadComponent: () => import('./profile/profile').then((m) => m.Profile), canActivate: [authGuard] },
  { path: 'orders', loadComponent: () => import('./orders/orders').then((m) => m.Orders), canActivate: [authGuard] },
  { path: 'cart', loadComponent: () => import('./cart/cart').then((m) => m.Cart), canActivate: [authGuard] },
  { path: 'recipes', loadComponent: () => import('./recipe-list/recipe-list').then((m) => m.RecipeList), canActivate: [authGuard] },
  { path: 'recipes/:id', loadComponent: () => import('./recipe-detail/recipe-detail').then((m) => m.RecipeDetail), canActivate: [authGuard] },
  { path: 'admin/orders', loadComponent: () => import('./admin/admin-orders/admin-orders').then((m) => m.AdminOrders), canActivate: [adminGuard] },
  { path: 'admin/dashboard', loadComponent: () => import('./admin/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard), canActivate: [adminGuard] },
  { path: 'admin/members', loadComponent: () => import('./admin/admin-members/admin-members').then((m) => m.AdminMembers), canActivate: [adminGuard] },
  // AD-08/09: khu quản trị recipe tách bạch hoàn toàn khỏi /recipes (trang xem của user).
  { path: 'admin/recipes', loadComponent: () => import('./admin/admin-recipes/admin-recipes').then((m) => m.AdminRecipes), canActivate: [adminGuard] },
  { path: 'admin/recipes/new', loadComponent: () => import('./admin/admin-recipe-form/admin-recipe-form').then((m) => m.AdminRecipeForm), canActivate: [adminGuard] },
  { path: 'admin/recipes/:id/edit', loadComponent: () => import('./admin/admin-recipe-form/admin-recipe-form').then((m) => m.AdminRecipeForm), canActivate: [adminGuard] },
  // Luôn để cuối cùng — bắt mọi đường dẫn không khớp route nào ở trên.
  { path: '**', loadComponent: () => import('./not-found/not-found').then((m) => m.NotFound) },
];
