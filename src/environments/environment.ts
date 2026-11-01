// Production build. apiUrl is replaced at deploy time (see README) with the deployed backend URL.
export const environment = {
  production: true,
  apiUrl: 'https://payroll-backend.onrender.com/payroll/api',
  currencyCode: 'INR',
  /** Rows per page on every paginated list (the API allows up to 100). */
  pageSize: 20,
};
