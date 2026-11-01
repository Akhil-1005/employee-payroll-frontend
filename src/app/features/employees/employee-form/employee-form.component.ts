import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Employee,
  EmployeeRequest,
  SALARY_TYPES,
  SalaryType,
  WORK_MODES,
  WorkMode,
} from '../../../core/models/employee.model';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

type EmployeeField = 'name' | 'email' | 'workMode' | 'salaryType' | 'salaryAmount' | 'password';

/** API field name for each form control, used to show server validation errors. */
const API_FIELD: Record<EmployeeField, string> = {
  name: 'name',
  email: 'email',
  workMode: 'role',
  salaryType: 'salaryType',
  salaryAmount: 'salaryAmount',
  password: 'password',
};

@Component({
  selector: 'app-employee-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LabelPipe],
  templateUrl: './employee-form.component.html',
})
export class EmployeeFormComponent implements OnInit {
  /** Employee being edited; null when creating. */
  readonly employee = input<Employee | null>(null);
  readonly saving = input(false);
  readonly serverErrors = input<Record<string, string>>({});

  readonly submitted = output<EmployeeRequest>();
  readonly cancelled = output<void>();

  protected readonly workModes = WORK_MODES;
  protected readonly salaryTypes = SALARY_TYPES;

  protected readonly form = inject(FormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    workMode: ['OFFICE' as WorkMode, Validators.required],
    salaryType: ['MONTHLY' as SalaryType, Validators.required],
    salaryAmount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    password: ['', [Validators.minLength(6), Validators.maxLength(100)]],
  });

  protected get isEdit(): boolean {
    return this.employee() !== null;
  }

  ngOnInit(): void {
    const employee = this.employee();
    if (employee) {
      this.form.patchValue({
        name: employee.name,
        email: employee.email,
        workMode: employee.role,
        salaryType: employee.salaryType,
        salaryAmount: employee.salaryAmount,
      });
    }
  }

  /** Client-side error first, otherwise the server's message for this field. */
  protected fieldError(field: EmployeeField): string | null {
    const control = this.form.controls[field];
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Enter a valid email address';
      if (control.errors['min']) return 'Must be greater than 0';
      if (control.errors['minlength']) return `Must be at least ${control.errors['minlength'].requiredLength} characters`;
      if (control.errors['maxlength']) return `Must be at most ${control.errors['maxlength'].requiredLength} characters`;
    }
    return this.serverErrors()[API_FIELD[field]] ?? null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request: EmployeeRequest = {
      name: value.name!.trim(),
      email: value.email!.trim(),
      role: value.workMode!,
      salaryType: value.salaryType!,
      salaryAmount: Number(value.salaryAmount),
    };
    if (!this.isEdit && value.password) {
      request.password = value.password;
    }
    this.submitted.emit(request);
  }
}
