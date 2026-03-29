<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-copy">
        <h1 class="auth-title">Budget Planner</h1>
        <p class="auth-subtitle">Sign in to manage your budget</p>
        <p class="auth-note">
          Use your account to review your monthly plan, update transactions, and keep reports in sync.
        </p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="auth-form"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" type="email" placeholder="you@example.com" size="large" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input v-model="form.password" type="password" placeholder="••••••••" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" native-type="submit" class="full-width">
            Sign in
          </el-button>
        </el-form-item>
        <p class="auth-footer">
          Don't have an account? <router-link to="/register">Register</router-link>
        </p>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login } from '../api/auth';
import { setStoredUser } from '../utils/auth';

const router = useRouter();
const route = useRoute();
const formRef = ref(null);
const loading = ref(false);
const form = reactive({ email: '', password: '' });
const rules = {
  email: [{ required: true, message: 'Email is required', trigger: 'blur' }, { type: 'email', message: 'Invalid email', trigger: 'blur' }],
  password: [{ required: true, message: 'Password is required', trigger: 'blur' }],
};

async function onSubmit() {
  await formRef.value?.validate().catch(() => {});
  loading.value = true;
  try {
    const { data } = await login(form);
    setStoredUser(data.user);
    ElMessage.success('Signed in successfully');
    router.push(route.query.redirect || '/');
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Login failed');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.auth-title {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
}
.auth-subtitle {
  margin: 0 0 24px;
  color: #64748b;
  font-size: 0.95rem;
}
.auth-note {
  margin: 0 0 20px;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.5;
}
.auth-form {
  margin-top: 8px;
}
.full-width {
  width: 100%;
}
.auth-footer {
  margin: 16px 0 0;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}
.auth-footer a {
  color: var(--primary);
  text-decoration: none;
}
.auth-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .auth-page {
    padding: 16px;
    align-items: stretch;
  }

  .auth-card {
    max-width: none;
    padding: 28px 20px;
    border-radius: 16px;
  }

  .auth-title {
    font-size: 1.5rem;
  }
}
</style>
