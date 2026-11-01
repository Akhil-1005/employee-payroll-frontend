/** One page of a list, as returned by every paginated endpoint. */
export interface PageResponse<T> {
  content: T[];
  /** Zero-based page index. */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** Paging parameters sent as ?page=&size=. */
export interface PageQuery {
  page: number;
  size: number;
}
