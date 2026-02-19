import client from './client';

export const getMonthlyComparison = (months = 6) =>
  client.get('/reports/monthly-comparison', { params: { months } });
export const getCategoryTrends = (monthKey) =>
  client.get('/reports/category-trends', { params: { monthKey } });
export const exportCsv = (monthKey) =>
  client.get('/reports/export/csv', { params: { monthKey }, responseType: 'blob' });
export const exportPdf = (monthKey) =>
  client.get('/reports/export/pdf', { params: { monthKey }, responseType: 'blob' });
