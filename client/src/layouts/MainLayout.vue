<template>
  <el-container class="main-layout">
    <el-aside v-if="!isMobile" width="220px" class="sidebar">
      <div class="logo">Budget Planner</div>
      <el-menu
        :default-active="activeMenu"
        router
        @select="closeMobileMenu"
        background-color="#1e293b"
        text-color="#e2e8f0"
        active-text-color="#38bdf8"
      >
        <template v-for="item in menuItems" :key="item.index">
          <el-menu-item :index="item.index">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-title">
          <el-button
            v-if="isMobile"
            circle
            class="menu-toggle"
            @click="mobileMenuOpen = true"
          >
            <el-icon><Menu /></el-icon>
          </el-button>
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-actions">
          <span class="user-name">{{ user?.name }}</span>
          <el-tooltip content="Sign out of your account" placement="bottom">
            <el-button type="danger" link @click="logout">Logout</el-button>
          </el-tooltip>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <el-drawer
    v-model="mobileMenuOpen"
    direction="ltr"
    size="260px"
    :with-header="false"
  >
    <div class="drawer-content">
      <div class="drawer-logo">Budget Planner</div>
      <el-menu
        :default-active="activeMenu"
        router
        @select="closeMobileMenu"
      >
        <template v-for="item in menuItems" :key="item.index">
          <el-menu-item :index="item.index">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { logout as logoutRequest } from '../api/auth';
import { clearStoredUser, getStoredUser } from '../utils/auth';

const route = useRoute();
const router = useRouter();
const isMobile = ref(false);
const mobileMenuOpen = ref(false);
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

const menuItems = computed(() => {
  const items = [
    { index: '/', label: 'Dashboard', icon: 'Odometer' },
    { index: '/transactions', label: 'Transactions', icon: 'List' },
    { index: '/plan', label: 'Monthly Plan', icon: 'Calendar' },
    { index: '/reports', label: 'Reports', icon: 'DataAnalysis' },
  ];

  if (user.value?.isAdmin) {
    items.push({ index: '/admin', label: 'Admin', icon: 'Setting' });
  }

  return items;
});

function updateScreenState() {
  isMobile.value = window.innerWidth < 900;
  if (!isMobile.value) {
    mobileMenuOpen.value = false;
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
}

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

onMounted(() => {
  updateScreenState();
  window.addEventListener('resize', updateScreenState);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScreenState);
});
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
  gap: 16px;
  padding: 0 24px;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-title {
  font-size: 1.25rem;
  font-weight: 600;
}
.menu-toggle {
  display: none;
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
.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.drawer-logo {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  padding-bottom: 8px;
}

@media (max-width: 899px) {
  .menu-toggle {
    display: inline-flex;
  }

  .header {
    padding: 0 16px;
  }

  .header-actions {
    gap: 8px;
  }

  .user-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .main-content {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .header {
    height: auto;
    min-height: 64px;
    padding: 12px 16px;
    align-items: flex-start;
  }

  .header-actions {
    flex-direction: column;
    align-items: flex-end;
  }

  .page-title {
    font-size: 1.1rem;
  }
}
</style>
