export interface Ingredient {
    name: string;
    quantity: number | null;
    unit: string;
    measure?: string;
}

export type RecipeCategory = 'main' | 'dessert' | 'drink';

export interface RecipeModel {
    id: string;
    name: string;
    description: string;
    price: number;
    imgUrl: string;
    videoUrl?: string;
    isFavorite: boolean;
    authorEmail: string;
    category: RecipeCategory;
    ingredients: Ingredient[];
}

export type UserRole = 'admin' | 'user';

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    avatarUrl: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

export type OrderStatus = 'in_progress' | 'completed' | 'cancelled';

export interface OrderModel {
    id: string;
    userEmail: string;
    recipeId: string;
    recipeName: string;
    recipeImgUrl: string;
    unitPrice: number;
    servings: number;
    totalPrice: number;
    promoDiscountPercent: number;
    status: OrderStatus;
    cancelReason: string | null;
    createdAt: string;
    updatedAt: string;
}

// Giỏ hàng — KHÔNG snapshot giá/tên như OrderModel, luôn phản ánh thông tin món mới
// nhất cho tới lúc thật sự xác nhận mua (khác Order, vốn là lịch sử cố định).
export interface CartItemModel {
    id: string;
    recipeId: string;
    recipeName: string;
    recipeImgUrl: string;
    category: RecipeCategory;
    unitPrice: number;
    servings: number;
    subtotal: number;
}

// Easter egg "bắt chuột trong bếp" — ưu đãi giảm giá % cho đơn tiếp theo.
export interface RewardModel {
    id: string;
    discountPercent: number;
    source: 'kitchen-rat';
    used: boolean;
    expiresAt: string;
    createdAt: string;
}

export interface OrderStats {
    totalOrders: number;
    totalRevenue: number;
    inProgressCount: number;
    cancelledCount: number;
    statusBreakdown: Record<OrderStatus, number>;
    revenueByDay: { date: string; revenue: number }[];
    topRecipes: { recipeName: string; orderCount: number }[];
}

// BE-18: sự kiện realtime qua SSE (xem stores/notification-store.ts).
export interface OrderNotificationSummary {
    id: string;
    recipeName: string;
    status: OrderStatus;
    userEmail: string;
}

export type NotificationEvent =
    | { type: 'order-created'; order: OrderNotificationSummary }
    | { type: 'order-status-changed'; userId: string; order: OrderNotificationSummary };
