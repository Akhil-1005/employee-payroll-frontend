import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { ApiError } from '../../core/models/api.model';
import { EmployeeOption } from '../../core/models/employee.model';
import { LEAVE_STATUSES, Leave, LeaveApplyRequest, LeaveStatus } from '../../core/models/leave.model';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { LeaveService } from '../../core/services/leave.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils/api.utils';
import { today } from '../../core/utils/date.utils';
import { pagedList } from '../../core/utils/paged-list';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { LabelPipe } from '../../shared/pipes/label.pipe';

/** End date must not be before start date. */
function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string;
  const end = group.get('endDate')?.value as string;
  return start && end && end < start ? { dateRange: true } : null;
}

@Component({
  selector: 'app-leave',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, LabelPipe, ModalComponent, PaginatorComponent],
  templateUrl: './leave.component.html',
})
export class LeaveComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly leaveService = inject(LeaveService);
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);

  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly statuses = LEAVE_STATUSES;

  protected readonly employees = signal<EmployeeOption[]>([]);
  protected readonly statusFilter = signal<LeaveStatus | ''>('');
  protected readonly employeeFilter = signal('');

  protected readonly leaves = pagedList((query) =>
    this.leaveService.getPage(
      {
        employeeId: this.isAdmin() ? this.employeeFilter() || undefined : undefined,
        status: this.statusFilter() || undefined,
      },
      query,
    ),
  );

  protected readonly applyOpen = signal(false);
  protected readonly applying = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly reviewing = signal<Leave | null>(null);
  protected readonly remarks = signal('');
  protected readonly reviewSaving = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      employeeId: [''],
      startDate: [today(), Validators.required],
      endDate: [today(), Validators.required],
      reason: ['', [Validators.required, Validators.maxLength(500)]],
    },
    { validators: dateRangeValidator },
  );

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.form.controls.employeeId.addValidators(Validators.required);
      this.employeeService.getOptions().subscribe({
        next: (employees) => this.employees.set(employees),
        error: (err: unknown) => this.toast.error(errorMessage(err)),
      });
    }
    this.leaves.load();
  }

  // Changing a filter starts again from the first page

  protected setStatusFilter(status: LeaveStatus | ''): void {
    this.statusFilter.set(status);
    this.leaves.reset();
  }

  protected setEmployeeFilter(employeeId: string): void {
    this.employeeFilter.set(employeeId);
    this.leaves.reset();
  }

  // ---------- Apply ----------

  protected openApply(): void {
    this.form.reset({ employeeId: '', startDate: today(), endDate: today(), reason: '' });
    this.serverErrors.set({});
    this.applyOpen.set(true);
  }

  protected apply(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request: LeaveApplyRequest = {
      startDate: value.startDate,
      endDate: value.endDate,
      reason: value.reason.trim(),
      ...(this.isAdmin() ? { employeeId: value.employeeId } : {}),
    };

    this.applying.set(true);
    this.leaveService.apply(request).subscribe({
      next: () => {
        this.applying.set(false);
        this.applyOpen.set(false);
        this.toast.success('Leave request submitted');
        this.leaves.load();
      },
      error: (err: ApiError) => {
        this.applying.set(false);
        this.serverErrors.set(err.fieldErrors);
        this.toast.error(err.message);
      },
    });
  }

  protected showError(field: 'employeeId' | 'startDate' | 'endDate' | 'reason'): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  // ---------- Review ----------

  protected openReview(leave: Leave): void {
    this.remarks.set('');
    this.reviewing.set(leave);
  }

  protected decide(status: 'APPROVED' | 'REJECTED'): void {
    const leave = this.reviewing();
    if (!leave) {
      return;
    }
    this.reviewSaving.set(true);
    this.leaveService.review(leave.id, { status, remarks: this.remarks().trim() || undefined }).subscribe({
      next: (updated) => {
        this.reviewSaving.set(false);
        this.reviewing.set(null);
        this.toast.success(`Leave ${status === 'APPROVED' ? 'approved' : 'rejected'} for ${updated.employeeName}`);
        this.leaves.load();
      },
      error: (err: unknown) => {
        this.reviewSaving.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }
}
