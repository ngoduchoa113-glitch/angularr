import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

// FE-06.1~06.4: debounce 400ms, trim khoảng trắng, không search dưới độ dài tối
// thiểu, không gửi lại keyword giống hệt lần trước. Cùng luật với recipe-store.ts,
// tách ra dùng chung cho các ô tìm kiếm ở trang quản trị (FE-07).
export function debouncedKeyword(source: Signal<string>, minLength = 2): Signal<string> {
  return toSignal(
    toObservable(source).pipe(
      debounceTime(400),
      map((k) => k.trim()),
      map((k) => (k.length > 0 && k.length < minLength ? '' : k)),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );
}
