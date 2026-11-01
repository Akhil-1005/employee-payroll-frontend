import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Leave, LeaveApplyRequest, LeaveReviewRequest, LeaveStatus } from '../models/leave.model';
import { PageQuery, PageResponse } from '../models/page.model';
import { unwrap, withPaging } from '../utils/api.utils';

export interface LeaveFilters {
  employeeId?: string;
  status?: LeaveStatus;
}

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/leaves`;

  apply(request: LeaveApplyRequest): Observable<Leave> {
    return this.http.post<ApiResponse<Leave>>(this.baseUrl, request).pipe(unwrap());
  }

  review(leaveId: string, request: LeaveReviewRequest): Observable<Leave> {
    return this.http.patch<ApiResponse<Leave>>(`${this.baseUrl}/${leaveId}/review`, request).pipe(unwrap());
  }

  /** One page of leave requests, newest first. */
  getPage(filters: LeaveFilters, query: PageQuery): Observable<PageResponse<Leave>> {
    let params = new HttpParams();
    if (filters.employeeId) {
      params = params.set('employeeId', filters.employeeId);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http
      .get<ApiResponse<PageResponse<Leave>>>(this.baseUrl, { params: withPaging(params, query) })
      .pipe(unwrap());
  }
}
