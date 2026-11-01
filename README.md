# Payroll Frontend

> **Mini Payroll & Attendance System**
> - **Live app: https://employee-payroll-frontend-eight.ver     cel.app**
> - Demo logins: Admin `admin@payroll.com` / `Admin@payroll` · Employee `ananya.rao@payroll.com` / `Employee@123`
> - Backend repository: https://github.com/Akhil-1005/employee-payroll-backend · API: https://employee-payroll-backend-0h40.onrender.com/payroll
> - Backend runs on Render's free tier: after 15 minutes idle, the first request takes about 50 seconds.

Angular 18 single-page app for the Mini Payroll & Attendance System. It talks to the Spring Boot API in the [backend repository](https://github.com/Akhil-1005/employee-payroll-backend).

**Stack:** Angular 18 (standalone components, signals, new control flow) · Reactive Forms · RxJS · SCSS (no UI library)

## Pages

| Page | Admin | Employee |
|---|---|---|
| **Login** | JWT sign-in | JWT sign-in |
| **Employee List** | List, search, add, edit, deactivate employees | – (hidden) |
| **Attendance** | Mark present/absent per employee for any past date, **bulk mark** all or selected employees, view any employee's history | Own attendance history |
| **Leave** | See all requests, filter by status or employee, approve or reject with remarks, apply on behalf of an employee | Apply for leave, track own requests |
| **Payroll** | Pick a month and see every employee's pay with totals. Click a row for the full breakdown | Own salary breakdown for any month |

## Structure

```
src/app/
├── core/
│   ├── models/         API types (mirror the backend DTOs)
│   ├── services/       One service per backend resource + AuthService, ToastService
│   ├── interceptors/   auth (adds Bearer token), error (normalises errors, logs out on 401)
│   ├── guards/         authGuard, adminGuard, guestGuard
│   └── utils/          response unwrapping, date helpers
├── shared/             Modal, toast container, enum label pipe
├── layout/shell/       Sidebar + top bar, role-aware navigation
└── features/           login, employees, attendance, leaves, payroll (lazy loaded)
```

- **Role-based UI:** navigation, routes (`adminGuard`) and actions follow the user's role. The backend enforces the same rules again, so the UI is never the only check.
- **Error handling:** every HTTP error becomes an `ApiError { status, message, fieldErrors }`. Forms show field-level server validation messages, and other errors appear as toasts.
- **Configuration:** the API URL, currency and page size come from `src/environments/`. Business rules such as the monthly divisor come from the backend (`daysPerMonth` in the payroll response), so the UI never repeats them.
- **Pagination:** every list (employees, daily attendance, attendance history, leave, payroll) is paged on the server. The UI is one shared `app-paginator` component. The state lives in one `pagedList()` helper (`core/utils/paged-list.ts`), which handles current page, loading, stale-request cancellation, cleanup and error toasts, so each screen only supplies its fetch call. Page size comes from `environment.pageSize`. Employee search runs on the server, debounced by 300 ms. Dropdowns use the lightweight `/employees/options` endpoint.
- **Performance:** every component uses `OnPush` change detection, with state held in signals, so Angular only re-renders a component when its signals, inputs or events change. List loads cancel any previous in-flight request, so a slow, older response can never overwrite newer data.

## Setup

```bash
npm install
npm start            # http://localhost:4200, uses environment.development.ts (API at http://localhost:8080/payroll/api)
npm run build        # production build to dist/payroll-frontend/browser
```

The backend must be running and must allow `http://localhost:4200` in `CORS_ALLOWED_ORIGINS` (this is the default).

## Deployment (Vercel)

1. Set `apiUrl` in `src/environments/environment.ts` to the deployed backend, e.g. `https://<backend>.onrender.com/payroll/api`.
2. Import the folder into Vercel. `vercel.json` sets the build command, the output directory and SPA rewrites.
3. Add the Vercel URL to the backend's `CORS_ALLOWED_ORIGINS`.
