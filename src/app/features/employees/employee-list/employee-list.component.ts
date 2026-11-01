import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { ApiError } from '../../../core/models/api.model';
import { Employee, EmployeeRequest } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { ToastService } from '../../../core/services/toast.service';
import { errorMessage } from '../../../core/utils/api.utils';
import { pagedList } from '../../../core/utils/paged-list';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PaginatorComponent } from '../../../shared/components/paginator/paginator.component';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';

/** Wait this long after the last keystroke before searching on the server. */
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-employee-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, FormsModule, LabelPipe, ModalComponent, PaginatorComponent, EmployeeFormComponent],
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms = new Subject<string>();

  protected readonly search = signal('');
  protected readonly showInactive = signal(false);

  protected readonly employees = pagedList((query) =>
    this.employeeService.getPage({ includeInactive: this.showInactive(), search: this.search() }, query),
  );

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Employee | null>(null);
  protected readonly saving = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly deactivating = signal<Employee | null>(null);

  ngOnInit(): void {
    // Search runs on the server: wait for typing to pause, then reload from the first page
    this.searchTerms
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.employees.reset());
    this.employees.load();
  }

  protected onSearch(term: string): void {
    this.search.set(term);
    this.searchTerms.next(term.trim());
  }

  protected toggleInactive(value: boolean): void {
    this.showInactive.set(value);
    this.employees.reset();
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.serverErrors.set({});
    this.formOpen.set(true);
  }

  protected openEdit(employee: Employee): void {
    this.editing.set(employee);
    this.serverErrors.set({});
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected save(request: EmployeeRequest): void {
    const editing = this.editing();
    const call = editing
      ? this.employeeService.update(editing.id, request)
      : this.employeeService.create(request);

    this.saving.set(true);
    call.subscribe({
      next: () => {
        this.toast.success(editing ? 'Employee updated' : 'Employee created');
        this.saving.set(false);
        this.formOpen.set(false);
        // Reload so the page reflects server-side sorting and paging
        this.employees.load();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.serverErrors.set(err.fieldErrors);
        this.toast.error(err.message);
      },
    });
  }

  protected confirmDeactivate(): void {
    const employee = this.deactivating();
    if (!employee) {
      return;
    }
    this.employeeService.deactivate(employee.id).subscribe({
      next: () => {
        this.deactivating.set(null);
        this.toast.success(`${employee.name} deactivated`);
        // The last row of a page may have gone; step back if the page is now empty
        const page = this.employees.page();
        if (page && page.content.length === 1 && page.page > 0 && !this.showInactive()) {
          this.employees.goTo(page.page - 1);
        } else {
          this.employees.load();
        }
      },
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }
}
