/** Where the employee works. Sent as the "role" field, the name the assignment spec uses. */
export type WorkMode = 'WFH' | 'OFFICE' | 'ON_SITE';
export type SalaryType = 'MONTHLY' | 'DAILY';

export const WORK_MODES: WorkMode[] = ['WFH', 'OFFICE', 'ON_SITE'];
export const SALARY_TYPES: SalaryType[] = ['MONTHLY', 'DAILY'];

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: WorkMode;
  salaryType: SalaryType;
  salaryAmount: number;
  active: boolean;
  createdOn: string;
}

/** Minimal employee entry for dropdowns. */
export interface EmployeeOption {
  id: string;
  name: string;
}

export interface EmployeeRequest {
  name: string;
  email: string;
  role: WorkMode;
  salaryType: SalaryType;
  salaryAmount: number;
  /** Only sent on create. Creates an EMPLOYEE login using the email as username. */
  password?: string;
}
