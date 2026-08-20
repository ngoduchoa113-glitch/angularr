import { HttpErrorResponse } from '@angular/common/http';

// Mã lỗi do backend trả về cho toàn bộ luồng upload/moderation ảnh (uploads.controller.ts
// + ImageModerationException) — message đi kèm mỗi mã đã là tiếng Việt thân thiện sẵn
// (mục 13: không hiện thuật ngữ kỹ thuật như "adult = LIKELY"), nên FE chỉ cần hiển thị
// lại nguyên message đó khi nhận diện đúng code, không cần định nghĩa lại chuỗi ở đây.
const IMAGE_ERROR_CODES = new Set([
  'IMAGE_MODERATION_REJECTED',
  'IMAGE_MODERATION_REVIEW',
  'IMAGE_MODERATION_ERROR',
  'IMAGE_INVALID_FORMAT',
  'IMAGE_TOO_LARGE',
  'URL_INVALID',
  'URL_BLOCKED',
  'URL_FETCH_FAILED',
  'URL_NOT_IMAGE',
]);

export function resolveImageError(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const code = err.error?.code;
    const message = err.error?.message;
    if (typeof code === 'string' && IMAGE_ERROR_CODES.has(code) && typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}
