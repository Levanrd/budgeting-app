import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'transactions', name: 'Transactions', component: () => import('../views/Transactions.vue') },
      { path: 'plan', name: 'MonthlyPlan', component: () => import('../views/MonthlyPlan.vue') },
      { path: 'reports', name: 'Reports', component: () => import('../views/Reports.vue') },
      { path: 'admin', name: 'Admin', component: () => import('../views/Admin.vue'), meta: { admin: true } },
    ],
  },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.meta.guest && token) {
    next({ name: 'Dashboard' });
  } else if (to.meta.admin && !user?.isAdmin) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
