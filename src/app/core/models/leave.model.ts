export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const LEAVE_STATUSES: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

export interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  reviewerRemarks?: string;
  reviewedBy?: string;
  reviewedOn?: string;
  appliedOn: string;
}

export interface LeaveApplyRequest {
  employeeId?: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveReviewRequest {
  status: Exclude<LeaveStatus, 'PENDING'>;
  remarks?: string;
}
