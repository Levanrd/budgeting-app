import { createRouter, createWebHistory } from 'vue-router';
import { clearStoredUser, ensureSessionUser, getStoredUser } from '../utils/auth';

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

router.beforeEach(async (to, from, next) => {
  let user = getStoredUser();

  if (!user && (to.meta.requiresAuth || to.meta.admin)) {
    user = await ensureSessionUser();
  }

  if (user && to.meta.guest) {
    user = await ensureSessionUser();
  }

  if (to.meta.requiresAuth && !user) {
    clearStoredUser();
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }

  if (to.meta.guest && user) {
    next({ name: 'Dashboard' });
    return;
  }

  if (to.meta.admin && !user?.isAdmin) {
    next({ name: 'Dashboard' });
    return;
  }

  next();
});

export default router;
