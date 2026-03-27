<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">Budget Planner</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#1e293b"
        text-color="#e2e8f0"
        active-text-color="#38bdf8"
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <span>Dashboard</span>
        </el-menu-item>
        <el-menu-item index="/transactions">
          <el-icon><List /></el-icon>
          <span>Transactions</span>
        </el-menu-item>
        <el-menu-item index="/plan">
          <el-icon><Calendar /></el-icon>
          <span>Monthly Plan</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><DataAnalysis /></el-icon>
          <span>Reports</span>
        </el-menu-item>
        <el-menu-item v-if="user?.isAdmin" index="/admin">
          <el-icon><Setting /></el-icon>
          <span>Admin</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="page-title">{{ pageTitle }}</span>
        <div class="header-actions">
          <span class="user-name">{{ user?.name }}</span>
          <el-button type="danger" link @click="logout">Logout</el-button>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { logout as logoutRequest } from '../api/auth';
import { clearStoredUser, getStoredUser } from '../utils/auth';

const route = useRoute();
const router = useRouter();
const user = computed(() => {
  return getStoredUser() || {};
});

const activeMenu = computed(() => route.path || '/');
const pageTitle = computed(() => {
  const map = {
    '/': 'Dashboard',
    '/transactions': 'Transactions',
    '/plan': 'Monthly Plan',
    '/reports': 'Reports',
    '/admin': 'Admin',
  };
  return map[route.path] || 'Budget Planner';
});

async function logout() {
  try {
    await logoutRequest();
  } catch {
    // Clear client auth state even if the server session is already gone.
  } finally {
    clearStoredUser();
    router.push('/login');
  }
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}
.sidebar {
  background: #1e293b;
  color: #e2e8f0;
}
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: #f8fafc;
  border-bottom: 1px solid #334155;
}
.el-menu {
  border-right: none;
}
.header {
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.page-title {
  font-size: 1.25rem;
  font-weight: 600;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-name {
  color: #64748b;
  font-size: 0.9rem;
}
.main-content {
  padding: 24px;
  background: var(--app-bg);
}
</style>
