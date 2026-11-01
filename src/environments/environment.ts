// Production build: points at the deployed backend on Render.
export const environment = {
  production: true,
  apiUrl: 'https://employee-payroll-backend-0h40.onrender.com/payroll/api',
  currencyCode: 'INR',
  /** Rows per page on every paginated list (the API allows up to 100). */
  pageSize: 20,
};
