import { createRouter, createWebHistory } from 'vue-router';
import { clearStoredUser, ensureSessionUser, getStoredUser } from '../utils/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      guest: true,
      title: 'Login | Budget Planner',
      description: 'Sign in to Budget Planner to track expenses, manage monthly allocations, and review budget reports.',
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: {
      guest: true,
      title: 'Register | Budget Planner',
      description: 'Create your Budget Planner account to organize income, expenses, savings goals, and monthly plans.',
    },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: {
          title: 'Dashboard | Budget Planner',
          description: 'View your monthly budget dashboard with allocation summaries, spending totals, and category breakdowns.',
        },
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('../views/Transactions.vue'),
        meta: {
          title: 'Transactions | Budget Planner',
          description: 'Track income and expenses, manage transaction history, and organize your budget categories in one place.',
        },
      },
      {
        path: 'plan',
        name: 'MonthlyPlan',
        component: () => import('../views/MonthlyPlan.vue'),
        meta: {
          title: 'Monthly Plan | Budget Planner',
          description: 'Set your monthly income target and assign budget allocations across categories for smarter financial planning.',
        },
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('../views/Reports.vue'),
        meta: {
          title: 'Reports | Budget Planner',
          description: 'Analyze spending trends, compare monthly results, and export budget reports to CSV or PDF.',
        },
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        meta: {
          admin: true,
          title: 'Admin | Budget Planner',
          description: 'Manage budget categories and default allocations for the Budget Planner application.',
        },
      },
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

router.afterEach((to) => {
  const defaultTitle = 'Budget Planner | Personal Budget Tracking and Monthly Planning';
  const defaultDescription = 'Budget Planner helps you track income, manage expenses, plan monthly allocations, and review actionable budget reports.';
  const title = to.meta.title || defaultTitle;
  const description = to.meta.description || defaultDescription;

  document.title = title;

  const descriptionTag = document.querySelector('meta[name="description"]');
  const ogTitleTag = document.querySelector('meta[property="og:title"]');
  const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
  const twitterTitleTag = document.querySelector('meta[name="twitter:title"]');
  const twitterDescriptionTag = document.querySelector('meta[name="twitter:description"]');
  const canonicalTag = document.querySelector('link[rel="canonical"]');
  const currentUrl = window.location.href;

  if (descriptionTag) descriptionTag.setAttribute('content', description);
  if (ogTitleTag) ogTitleTag.setAttribute('content', title);
  if (ogDescriptionTag) ogDescriptionTag.setAttribute('content', description);
  if (twitterTitleTag) twitterTitleTag.setAttribute('content', title);
  if (twitterDescriptionTag) twitterDescriptionTag.setAttribute('content', description);
  if (canonicalTag) canonicalTag.setAttribute('href', currentUrl);
});

export default router;
