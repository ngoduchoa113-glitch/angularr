import { test, expect } from '@playwright/test';

test.describe('Recipe CRUD (frontend -> backend NestJS)', () => {
  test('danh sách công thức hiển thị dữ liệu từ backend', async ({ page }) => {
    await page.goto('/recipes');

    const localGrid = page.locator('.recipe-grid').first();
    await expect(localGrid.getByText('Spaghetti Carbonara')).toBeVisible();
    await expect(localGrid.getByText('Salad Caprese')).toBeVisible();
  });

  test('tìm kiếm gọi GET /recipes?keyword= của backend, không còn TheMealDB', async ({ page }) => {
    const requestedUrls: string[] = [];
    page.on('request', (req) => requestedUrls.push(req.url()));

    await page.goto('/recipes');
    await page.getByLabel('Tìm món ăn').fill('caprese');

    const grid = page.locator('.recipe-grid').first();
    await expect(grid.getByText('Salad Caprese')).toBeVisible();
    await expect(grid.getByText('Spaghetti Carbonara')).toHaveCount(0);
    await expect(page.getByText('Tìm thấy 1 món')).toBeVisible();

    expect(requestedUrls.some((u) => u.includes('/recipes?keyword=caprese'))).toBe(true);
    expect(requestedUrls.some((u) => u.includes('themealdb.com'))).toBe(false);

    await page.getByLabel('Tìm món ăn').fill('');
    await expect(grid.getByText('Spaghetti Carbonara')).toBeVisible();
  });

  test('thêm, sửa, rồi xoá một công thức', async ({ page }) => {
    const recipeName = `E2E Recipe ${Date.now()}`;

    // ─── Thêm công thức mới ───────────────────────────
    await page.goto('/recipes/new');

    await page.getByLabel('Tên món').fill(recipeName);
    await page.getByLabel('Mô tả').fill('Công thức tạo bởi Playwright e2e test');
    await page.getByLabel('Email tác giả').fill('e2e@test.com');
    await page.getByLabel('Giá').fill('99000');
    await page.getByLabel('Tên nguyên liệu').fill('Nguyên liệu test');
    await page.getByLabel('Số lượng').fill('2');
    await page.getByLabel('Đơn vị').fill('kg');

    await page.locator('form.recipe-form button[type=submit]').click();

    await expect(page.getByText('Đã thêm công thức thành công')).toBeVisible();
    await page.getByRole('button', { name: 'Xem món vừa thêm' }).click();

    await expect(page).toHaveURL(/\/recipes\/[a-f0-9]+$/);
    await expect(page.getByText(recipeName)).toBeVisible();
    await expect(page.getByText('99,000 VNĐ').first()).toBeVisible();

    // ─── Sửa công thức vừa tạo ───────────────────────────
    await page.locator('.edit-link').click();
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9]+\/edit$/);

    const priceInput = page.getByLabel('Giá');
    await priceInput.fill('150000');
    await page.locator('form.recipe-form button[type=submit]').click();

    await expect(page.getByText('Đã cập nhật công thức')).toBeVisible();
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9]+$/);
    await expect(page.getByText('150,000 VNĐ').first()).toBeVisible();

    // ─── Xoá công thức ───────────────────────────
    await page.locator('.delete-btn').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('.confirm-btn').click();

    await expect(page.getByText('Đã xoá công thức')).toBeVisible();
    await expect(page).toHaveURL(/\/recipes$/);

    const localGrid = page.locator('.recipe-grid').first();
    await expect(localGrid.getByText(recipeName)).toHaveCount(0);
  });

  test('không cho submit khi thiếu field bắt buộc', async ({ page }) => {
    await page.goto('/recipes/new');

    await page.locator('form.recipe-form button[type=submit]').click();

    await expect(page.getByText('Tên không được bỏ trống')).toBeVisible();
    await expect(page.getByText('Mô tả không được bỏ trống')).toBeVisible();
    await expect(page).toHaveURL(/\/recipes\/new$/);
  });
});
