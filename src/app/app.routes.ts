import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guards';
import { AuthService } from './core/services/auth.service';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · Payroll',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        // Admins land on the employee list, employees on their own payroll
        redirectTo: () => (inject(AuthService).isAdmin() ? 'employees' : 'payroll'),
      },
      {
        path: 'employees',
        canActivate: [adminGuard],
        title: 'Employees · Payroll',
        loadComponent: () =>
          import('./features/employees/employee-list/employee-list.component').then((m) => m.EmployeeListComponent),
      },
      {
        path: 'attendance',
        title: 'Attendance · Payroll',
        loadComponent: () =>
          import('./features/attendance/attendance.component').then((m) => m.AttendanceComponent),
      },
      {
        path: 'leaves',
        title: 'Leave · Payroll',
        loadComponent: () => import('./features/leaves/leave.component').then((m) => m.LeaveComponent),
      },
      {
        path: 'payroll',
        title: 'Payroll',
        loadComponent: () => import('./features/payroll/payroll.component').then((m) => m.PayrollComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
