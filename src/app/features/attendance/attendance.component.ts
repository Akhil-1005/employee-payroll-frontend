import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { AttendanceStatus, DailyAttendanceRow } from '../../core/models/attendance.model';
import { EmployeeOption } from '../../core/models/employee.model';
import { AttendanceService } from '../../core/services/attendance.service';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils/api.utils';
import { firstDayOfCurrentMonth, today } from '../../core/utils/date.utils';
import { pagedList } from '../../core/utils/paged-list';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { LabelPipe } from '../../shared/pipes/label.pipe';

type AttendanceTab = 'daily' | 'history';

@Component({
  selector: 'app-attendance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, LabelPipe, PaginatorComponent],
  templateUrl: './attendance.component.html',
})
export class AttendanceComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly maxDate = today();
  protected readonly tab = signal<AttendanceTab>(this.isAdmin() ? 'daily' : 'history');

  // ---------- Daily marking (admin): one call returns a page of rows plus whole-day counts ----------

  protected readonly date = signal(today());
  protected readonly bulkSaving = signal(false);
  protected readonly savingIds = signal<ReadonlySet<string>>(new Set());
  /** Employees ticked on the current page. Cleared on every load (page or date change). */
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());

  protected readonly daily = pagedList(
    (query) => this.attendanceService.getDailySheet(this.date(), query),
    { pageOf: (sheet) => sheet.page, onLoaded: () => this.selectedIds.set(new Set()) },
  );

  protected readonly allSelected = computed(() => {
    const rows = this.daily.items();
    return rows.length > 0 && rows.every((r) => this.selectedIds().has(r.employeeId));
  });

  // ---------- History ----------

  protected readonly employeeOptions = signal<EmployeeOption[]>([]);
  protected readonly historyEmployeeId = signal('');
  protected readonly fromDate = signal(firstDayOfCurrentMonth());
  protected readonly toDate = signal(today());

  protected readonly history = pagedList(
    (query) => this.attendanceService.getHistory(this.historyEmployeeId(), this.fromDate(), this.toDate(), query),
    { pageOf: (history) => history.page },
  );

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.daily.load();
    } else {
      this.historyEmployeeId.set(this.auth.user()?.employeeId ?? '');
      this.applyHistoryFilters();
    }
  }

  // ---------- Daily ----------

  protected changeDate(value: string): void {
    if (!value || value > this.maxDate) {
      return;
    }
    this.date.set(value);
    this.daily.reset();
  }

  protected mark(row: DailyAttendanceRow, status: AttendanceStatus): void {
    if (row.status === status || this.savingIds().has(row.employeeId)) {
      return;
    }
    this.setSaving(row.employeeId, true);
    this.attendanceService.mark({ employeeId: row.employeeId, date: this.date(), status }).subscribe({
      next: (saved) => {
        this.setSaving(row.employeeId, false);
        this.applyStatus(row.employeeId, row.status, saved.status);
      },
      error: (err: unknown) => {
        this.setSaving(row.employeeId, false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  /** Bulk marks the ticked employees, or every active employee (all pages) when none are ticked. */
  protected markBulk(status: AttendanceStatus): void {
    const selected = [...this.selectedIds()];
    this.bulkSaving.set(true);
    this.attendanceService
      .markBulk({ date: this.date(), status, employeeIds: selected.length > 0 ? selected : undefined })
      .subscribe({
        next: (result) => {
          this.bulkSaving.set(false);
          const label = status === 'PRESENT' ? 'present' : 'absent';
          this.toast.success(`Marked ${result.total} employee(s) ${label} (${result.created} new, ${result.updated} updated)`);
          const onLeave = result.onLeaveEmployeeIds?.length ?? 0;
          if (onLeave > 0) {
            this.toast.info(`${onLeave} employee(s) on approved leave were not marked. Select them to mark explicitly.`);
          }
          this.daily.load();
        },
        error: (err: unknown) => {
          this.bulkSaving.set(false);
          this.toast.error(errorMessage(err));
        },
      });
  }

  protected toggleSelected(employeeId: string): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  }

  protected toggleAll(): void {
    this.selectedIds.set(this.allSelected() ? new Set() : new Set(this.daily.items().map((r) => r.employeeId)));
  }

  private setSaving(employeeId: string, saving: boolean): void {
    this.savingIds.update((current) => {
      const next = new Set(current);
      if (saving) {
        next.add(employeeId);
      } else {
        next.delete(employeeId);
      }
      return next;
    });
  }

  /** Updates one row and the whole-day counts locally, so a single mark needs no reload. */
  private applyStatus(employeeId: string, previous: AttendanceStatus | undefined, next: AttendanceStatus): void {
    this.daily.update((sheet) => {
      const counts = { present: sheet.present, absent: sheet.absent, unmarked: sheet.unmarked };
      if (previous === 'PRESENT') counts.present--;
      else if (previous === 'ABSENT') counts.absent--;
      else counts.unmarked--;
      if (next === 'PRESENT') counts.present++;
      else counts.absent++;

      return {
        ...sheet,
        ...counts,
        page: {
          ...sheet.page,
          content: sheet.page.content.map((r) => (r.employeeId === employeeId ? { ...r, status: next } : r)),
        },
      };
    });
  }

  // ---------- History ----------

  protected openHistory(): void {
    this.tab.set('history');
    if (this.employeeOptions().length > 0) {
      return;
    }
    this.employeeService
      .getOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => {
          this.employeeOptions.set(options);
          if (!this.historyEmployeeId() && options.length > 0) {
            this.selectHistoryEmployee(options[0].id);
          }
        },
        error: (err: unknown) => this.toast.error(errorMessage(err)),
      });
  }

  protected selectHistoryEmployee(employeeId: string): void {
    this.historyEmployeeId.set(employeeId);
    this.applyHistoryFilters();
  }

  /** Reloads history from the first page after the employee or date range changed. */
  protected applyHistoryFilters(): void {
    if (!this.historyEmployeeId()) {
      this.history.clear();
      return;
    }
    if (this.fromDate() > this.toDate()) {
      this.toast.error("'From' date must be on or before 'To' date");
      return;
    }
    this.history.reset();
  }
}
