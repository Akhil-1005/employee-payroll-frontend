import { SalaryType, WorkMode } from './employee.model';
import { PageResponse } from './page.model';

/** Payroll for all active employees in a month: totals for everyone plus one page of rows. */
export interface PayrollRun {
  month: string;
  /** Divisor for monthly salaries, from the backend configuration. */
  daysPerMonth: number;
  employeeCount: number;
  totalGrossPay: number;
  totalPayableDays: number;
  page: PageResponse<PayrollBreakdown>;
}

export interface PayrollBreakdown {
  employeeId: string;
  employeeName: string;
  role: WorkMode;
  /** False for employees deactivated after the month, who still appear in its payroll run. */
  active: boolean;
  month: string;
  salaryType: SalaryType;
  salaryAmount: number;
  /** Present only for monthly salaries. */
  daysPerMonthDivisor?: number;
  perDayRate: number;
  daysInMonth: number;
  presentDays: number;
  absentDays: number;
  approvedLeaveDays: number;
  paidLeaveDays: number;
  unmarkedDays: number;
  payableDays: number;
  grossPay: number;
  formula: string;
}
