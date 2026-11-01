import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { OperatorFunction, map } from 'rxjs';

import { ApiError, ApiResponse } from '../models/api.model';
import { PageQuery } from '../models/page.model';

/** Adds ?page=&size= to a request. */
export function withPaging(params: HttpParams, query: PageQuery): HttpParams {
  return params.set('page', query.page).set('size', query.size);
}

/** Unwraps the `data` field from the backend response envelope. */
export function unwrap<T>(): OperatorFunction<ApiResponse<T>, T> {
  return map((response) => response.data);
}

/** Converts any HTTP failure into a predictable {@link ApiError}. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return { status: 0, message: 'Cannot reach the server. Please check your connection.', fieldErrors: {} };
    }
    const body = error.error as Partial<ApiResponse<unknown>> | null;
    return {
      status: error.status,
      message: body?.message ?? `Request failed (${error.status})`,
      fieldErrors: body?.errors ?? {},
    };
  }
  return { status: -1, message: 'Something went wrong. Please try again.', fieldErrors: {} };
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'message' in value && 'fieldErrors' in value;
}

export function errorMessage(error: unknown): string {
  return isApiError(error) ? error.message : toApiError(error).message;
}
