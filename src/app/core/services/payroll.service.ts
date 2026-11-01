import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { PageQuery } from '../models/page.model';
import { PayrollBreakdown, PayrollRun } from '../models/payroll.model';
import { unwrap, withPaging } from '../utils/api.utils';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/payroll`;

  /** @param month yyyy-MM */
  getForEmployee(employeeId: string, month: string): Observable<PayrollBreakdown> {
    const params = new HttpParams().set('month', month);
    return this.http
      .get<ApiResponse<PayrollBreakdown>>(`${this.baseUrl}/employee/${employeeId}`, { params })
      .pipe(unwrap());
  }

  /** Payroll run for all active employees: totals plus one page of rows. @param month yyyy-MM */
  getRun(month: string, query: PageQuery): Observable<PayrollRun> {
    const params = withPaging(new HttpParams().set('month', month), query);
    return this.http.get<ApiResponse<PayrollRun>>(this.baseUrl, { params }).pipe(unwrap());
  }
}
