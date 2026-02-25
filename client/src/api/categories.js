import client from './client';

export const getCategories = (params) => client.get('/categories', { params });
export const createCategory = (data) => client.post('/categories', data);
export const updateCategory = (id, data) => client.put(`/categories/${id}`, data);
export const deleteCategory = (id) => client.delete(`/categories/${id}`);
