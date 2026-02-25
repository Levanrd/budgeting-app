import client from './client';

export const getBudgets = (params) => client.get('/budgets', { params });
export const getBudgetSummary = (monthKey) => client.get(`/budgets/summary/${monthKey}`);
export const saveBudget = (data) => client.post('/budgets', data);
export const updateBudget = (monthKey, data) => client.put(`/budgets/${monthKey}`, data);
