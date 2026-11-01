/** Envelope returned by every backend endpoint. */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  data: T;
  errors?: Record<string, string>;
  timestamp: string;
}

/** Normalised error passed to components by the error interceptor. */
export interface ApiError {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
}
