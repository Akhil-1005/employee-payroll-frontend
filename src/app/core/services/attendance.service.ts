import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import {
  Attendance,
  AttendanceHistory,
  AttendanceRequest,
  BulkAttendanceRequest,
  BulkAttendanceResult,
  DailyAttendanceSheet,
} from '../models/attendance.model';
import { PageQuery } from '../models/page.model';
import { unwrap, withPaging } from '../utils/api.utils';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/attendance`;

  mark(request: AttendanceRequest): Observable<Attendance> {
    return this.http.post<ApiResponse<Attendance>>(this.baseUrl, request).pipe(unwrap());
  }

  markBulk(request: BulkAttendanceRequest): Observable<BulkAttendanceResult> {
    return this.http.post<ApiResponse<BulkAttendanceResult>>(`${this.baseUrl}/bulk`, request).pipe(unwrap());
  }

  /** Daily sheet: one page of active employees with their status, plus whole-day counts. */
  getDailySheet(date: string, query: PageQuery): Observable<DailyAttendanceSheet> {
    const params = withPaging(new HttpParams().set('date', date), query);
    return this.http.get<ApiResponse<DailyAttendanceSheet>>(`${this.baseUrl}/daily`, { params }).pipe(unwrap());
  }

  /** One page of an employee's attendance (newest first), plus counts for the whole range. */
  getHistory(employeeId: string, from: string, to: string, query: PageQuery): Observable<AttendanceHistory> {
    const params = withPaging(new HttpParams().set('from', from).set('to', to), query);
    return this.http
      .get<ApiResponse<AttendanceHistory>>(`${this.baseUrl}/employee/${employeeId}`, { params })
      .pipe(unwrap());
  }
}
