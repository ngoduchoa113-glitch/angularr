import { computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { AuthUser } from '../models';
import { AuthApiService } from '../services/auth-api.service';

const STORAGE_KEY = 'auth';

type AuthState = {
    token: string | null;
    refreshToken: string | null;
    user: AuthUser | null;
};

const EMPTY_STATE: AuthState = { token: null, refreshToken: null, user: null };

// Đọc phiên đăng nhập đã lưu (nếu có) ngay khi store khởi tạo, để refresh trang
// không làm mất trạng thái đăng nhập — cùng kỹ thuật với initialMode() trong theme-store.ts.
function initialAuthState(): AuthState {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return EMPTY_STATE;
    }

    try {
        const parsed = JSON.parse(raw) as AuthState;
        return parsed.token && parsed.refreshToken && parsed.user ? parsed : EMPTY_STATE;
    } catch {
        return EMPTY_STATE;
    }
}

function persist(state: AuthState): void {
    if (state.token && state.refreshToken && state.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
}

export const AuthStore = signalStore(
    { providedIn: 'root' },

    withState<AuthState>(initialAuthState()),

    withComputed((store) => ({
        isAuthenticated: computed(() => !!store.token()),
        isAdmin: computed(() => store.user()?.role === 'admin'),
    })),

    // Nơi DUY NHẤT được đổi state
    withMethods((store) => {
        const authApi = inject(AuthApiService);

        // Nhiều request có thể 401 gần như cùng lúc (vd load trang gọi vài API song
        // song) — dùng chung 1 promise refresh đang chạy thay vì gọi /auth/refresh
        // nhiều lần, refresh token chỉ dùng được 1 lần (rotation).
        let refreshInFlight: Promise<string> | null = null;

        function setSession(res: { accessToken: string; refreshToken: string; user: AuthUser }): void {
            const nextState: AuthState = { token: res.accessToken, refreshToken: res.refreshToken, user: res.user };
            patchState(store, nextState);
            persist(nextState);
        }

        return {
            async login(email: string, password: string): Promise<void> {
                const res = await firstValueFrom(authApi.login(email, password));
                setSession(res);
            },

            async register(email: string, password: string): Promise<void> {
                const res = await firstValueFrom(authApi.register(email, password));
                setSession(res);
            },

            // Trả về access token mới; ném lỗi nếu refresh token cũng đã hết hạn/bị thu hồi.
            refreshSession(): Promise<string> {
                if (refreshInFlight) {
                    return refreshInFlight;
                }

                const currentRefreshToken = store.refreshToken();
                if (!currentRefreshToken) {
                    return Promise.reject(new Error('Không có refresh token'));
                }

                refreshInFlight = (async () => {
                    try {
                        const res = await firstValueFrom(authApi.refresh(currentRefreshToken));
                        setSession(res);
                        return res.accessToken;
                    } finally {
                        refreshInFlight = null;
                    }
                })();

                return refreshInFlight;
            },

            logout(): void {
                const currentRefreshToken = store.refreshToken();
                patchState(store, EMPTY_STATE);
                persist(EMPTY_STATE);
                if (currentRefreshToken) {
                    // Best-effort: thu hồi refresh token phía server, không chặn logout phía client.
                    firstValueFrom(authApi.logout(currentRefreshToken)).catch(() => undefined);
                }
            },

            // Dùng sau khi đổi mật khẩu (server cấp lại cặp token mới, phiên hiện tại
            // tiếp tục hoạt động liền mạch dù các phiên khác đã bị thu hồi).
            applySession(res: { accessToken: string; refreshToken: string; user: AuthUser }): void {
                setSession(res);
            },

            // Cập nhật thông tin user cục bộ sau khi sửa profile (name/avatar/email),
            // không cần gọi lại API — server đã xác nhận thành công trước đó.
            patchUser(partial: Partial<AuthUser>): void {
                const currentUser = store.user();
                if (!currentUser) {
                    return;
                }
                const nextState: AuthState = { token: store.token(), refreshToken: store.refreshToken(), user: { ...currentUser, ...partial } };
                patchState(store, nextState);
                persist(nextState);
            },
        };
    }),
);
