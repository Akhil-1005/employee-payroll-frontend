import { WorkMode } from './employee.model';
import { PageResponse } from './page.model';

export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: AttendanceStatus;
}

/** One row of the daily sheet. `status` is absent when the employee is not marked yet. */
export interface DailyAttendanceRow {
  employeeId: string;
  employeeName: string;
  role: WorkMode;
  status?: AttendanceStatus;
}

export interface DailyAttendanceSheet {
  date: string;
  /** Counts for the whole day, not just the current page. */
  totalEmployees: number;
  present: number;
  absent: number;
  unmarked: number;
  page: PageResponse<DailyAttendanceRow>;
}

export interface AttendanceHistory {
  employeeId: string;
  from: string;
  to: string;
  /** Counts for the whole range, not just the current page. */
  present: number;
  absent: number;
  page: PageResponse<Attendance>;
}

export interface AttendanceRequest {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
}

export interface BulkAttendanceRequest {
  date: string;
  status: AttendanceStatus;
  /** Omit to mark every active employee. */
  employeeIds?: string[];
}

export interface BulkAttendanceResult {
  date: string;
  status: AttendanceStatus;
  created: number;
  updated: number;
  total: number;
  skippedEmployeeIds: string[];
  /** Left unmarked by "mark everyone present" because they are on approved leave that day. */
  onLeaveEmployeeIds: string[];
}
