// ============================================
// Net-On — Shared API Response Types
// ============================================

/** Standard paginated API response */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Standard API error response */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

/** Standard API success response */
export interface ApiSuccessResponse<T = void> {
  success: true;
  message?: string;
  data?: T;
}

/** Pagination query parameters */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/** Date range filter */
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}
