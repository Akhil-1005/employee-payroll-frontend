import { Pipe, PipeTransform } from '@angular/core';

const LABELS: Record<string, string> = {
  WFH: 'WFH',
  OFFICE: 'Office',
  ON_SITE: 'On-site',
  MONTHLY: 'Monthly',
  DAILY: 'Daily',
  PRESENT: 'Present',
  ABSENT: 'Absent',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

/** Turns API enum values (ON_SITE) into display labels (On-site). */
@Pipe({ name: 'label', standalone: true })
export class LabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? (LABELS[value] ?? value) : '';
  }
}
