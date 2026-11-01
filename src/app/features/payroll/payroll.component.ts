import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { PayrollBreakdown } from '../../core/models/payroll.model';
import { AuthService } from '../../core/services/auth.service';
import { PayrollService } from '../../core/services/payroll.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils/api.utils';
import { currentMonth } from '../../core/utils/date.utils';
import { pagedList } from '../../core/utils/paged-list';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { PayrollBreakdownComponent } from './payroll-breakdown/payroll-breakdown.component';

@Component({
  selector: 'app-payroll',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, FormsModule, LabelPipe, ModalComponent, PaginatorComponent, PayrollBreakdownComponent],
  templateUrl: './payroll.component.html',
})
export class PayrollComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly payrollService = inject(PayrollService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly maxMonth = currentMonth();
  protected readonly month = signal(currentMonth());

  /** Admin: payroll run with totals for every employee and one page of rows. */
  protected readonly run = pagedList((query) => this.payrollService.getRun(this.month(), query), {
    pageOf: (run) => run.page,
  });
  protected readonly selected = signal<PayrollBreakdown | null>(null);

  /** Employee: own payroll for the month (a single breakdown, not a list). */
  protected readonly own = signal<PayrollBreakdown | null>(null);
  protected readonly loadingOwn = signal(false);
  /** In-flight own-payroll load. Switching month cancels it so an older month can't replace the newer one. */
  private ownRequest?: Subscription;

  ngOnInit(): void {
    this.reload();
  }

  protected changeMonth(value: string): void {
    if (!value || value > this.maxMonth) {
      return;
    }
    this.month.set(value);
    this.reload();
  }

  private reload(): void {
    if (this.isAdmin()) {
      this.run.reset();
    } else {
      this.loadOwn();
    }
  }

  private loadOwn(): void {
    const employeeId = this.auth.user()?.employeeId;
    if (!employeeId) {
      this.toast.error('No employee profile is linked to this account');
      return;
    }
    this.loadingOwn.set(true);
    this.ownRequest?.unsubscribe();
    this.ownRequest = this.payrollService
      .getForEmployee(employeeId, this.month())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (breakdown) => {
          this.own.set(breakdown);
          this.loadingOwn.set(false);
        },
        error: (err: unknown) => {
          this.loadingOwn.set(false);
          this.toast.error(errorMessage(err));
        },
      });
  }
}
