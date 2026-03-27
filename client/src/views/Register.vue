<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Create account</h1>
      <p class="auth-subtitle">Start planning your budget</p>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="auth-form"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="form.name" placeholder="Your name" size="large" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" type="email" placeholder="you@example.com" size="large" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input v-model="form.password" type="password" placeholder="At least 6 characters" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" native-type="submit" class="full-width">
            Register
          </el-button>
        </el-form-item>
        <p class="auth-footer">
          Already have an account? <router-link to="/login">Sign in</router-link>
        </p>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { register } from '../api/auth';
import { setStoredUser } from '../utils/auth';

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);
const form = reactive({ name: '', email: '', password: '' });
const rules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  email: [{ required: true, message: 'Email is required', trigger: 'blur' }, { type: 'email', message: 'Invalid email', trigger: 'blur' }],
  password: [{ required: true, message: 'Password is required', trigger: 'blur' }, { min: 6, message: 'At least 6 characters', trigger: 'blur' }],
};

async function onSubmit() {
  await formRef.value?.validate().catch(() => {});
  loading.value = true;
  try {
    const { data } = await register(form);
    setStoredUser(data.user);
    ElMessage.success('Account created');
    router.push('/');
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Registration failed');
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
</style>
