import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Employee, EmployeeOption, EmployeeRequest } from '../models/employee.model';
import { PageQuery, PageResponse } from '../models/page.model';
import { unwrap, withPaging } from '../utils/api.utils';

export interface EmployeeFilters {
  includeInactive?: boolean;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/employees`;

  /** One page of employees sorted by name, filtered on the server. */
  getPage(filters: EmployeeFilters, query: PageQuery): Observable<PageResponse<Employee>> {
    let params = new HttpParams().set('includeInactive', filters.includeInactive ?? false);
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    return this.http
      .get<ApiResponse<PageResponse<Employee>>>(this.baseUrl, { params: withPaging(params, query) })
      .pipe(unwrap());
  }

  /** Active employees as id/name pairs for dropdowns. */
  getOptions(): Observable<EmployeeOption[]> {
    return this.http.get<ApiResponse<EmployeeOption[]>>(`${this.baseUrl}/options`).pipe(unwrap());
  }

  create(request: EmployeeRequest): Observable<Employee> {
    return this.http.post<ApiResponse<Employee>>(this.baseUrl, request).pipe(unwrap());
  }

  update(id: string, request: EmployeeRequest): Observable<Employee> {
    return this.http.put<ApiResponse<Employee>>(`${this.baseUrl}/${id}`, request).pipe(unwrap());
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(unwrap());
  }
}
