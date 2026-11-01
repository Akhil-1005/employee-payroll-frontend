import { DestroyRef, Signal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PageQuery, PageResponse } from '../models/page.model';
import { ToastService } from '../services/toast.service';
import { errorMessage } from './api.utils';

export interface PagedListOptions<R, T> {
  /**
   * Where the page lives in the response. Omit when the endpoint returns a page directly;
   * set it for responses that wrap a page with extra data (e.g. whole-day counts or totals).
   */
  pageOf?: (response: R) => PageResponse<T>;
  /** Called after every successful load. */
  onLoaded?: (response: R) => void;
}

/**
 * State for one server-paginated list: current page, loading flag, latest response and the
 * page/items inside it. Shared by every list screen so each one only supplies its fetch call.
 */
export interface PagedList<R, T> {
  /** Latest full response (a page, or a wrapper around one). */
  readonly response: Signal<R | null>;
  readonly page: Signal<PageResponse<T> | null>;
  readonly items: Signal<T[]>;
  readonly loading: Signal<boolean>;
  readonly currentPage: Signal<number>;
  /** Reloads the current page. */
  load(): void;
  goTo(page: number): void;
  /** Back to the first page, e.g. after a filter changed. */
  reset(): void;
  /** Cancels any in-flight request and empties the list. */
  clear(): void;
  /** Applies a local change to the loaded response without refetching. */
  update(change: (response: R) => R): void;
}

/**
 * Creates a {@link PagedList}. Call it from a field initializer (injection context).
 *
 * The fetch function is called on every load with the current page query, and can read
 * component signals (filters, dates) at that moment. Starting a new load cancels the previous
 * request, so a slow, older response can never overwrite newer data. Requests are also cancelled
 * when the component is destroyed, and errors are shown as a toast.
 *
 * @example
 * protected readonly leaves = pagedList((query) => this.leaveService.getPage(this.filters(), query));
 */
export function pagedList<R, T = R extends PageResponse<infer I> ? I : never>(
  fetch: (query: PageQuery) => Observable<R>,
  options: PagedListOptions<R, T> = {},
): PagedList<R, T> {
  const destroyRef = inject(DestroyRef);
  const toast = inject(ToastService);

  const response = signal<R | null>(null);
  const loading = signal(false);
  const currentPage = signal(0);
  let request: Subscription | undefined;

  const pageOf = options.pageOf ?? ((value: R) => value as unknown as PageResponse<T>);
  const page = computed(() => {
    const value = response();
    return value ? pageOf(value) : null;
  });
  const items = computed(() => page()?.content ?? []);

  const load = (): void => {
    loading.set(true);
    request?.unsubscribe();
    request = fetch({ page: currentPage(), size: environment.pageSize })
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({
        next: (value) => {
          response.set(value);
          loading.set(false);
          options.onLoaded?.(value);
        },
        error: (err: unknown) => {
          loading.set(false);
          toast.error(errorMessage(err));
        },
      });
  };

  const goTo = (pageIndex: number): void => {
    currentPage.set(pageIndex);
    load();
  };

  return {
    response: response.asReadonly(),
    page,
    items,
    loading: loading.asReadonly(),
    currentPage: currentPage.asReadonly(),
    load,
    goTo,
    reset: () => goTo(0),
    clear: () => {
      request?.unsubscribe();
      response.set(null);
      loading.set(false);
    },
    update: (change) => response.update((value) => (value ? change(value) : value)),
  };
}
