<template>
  <div class="admin-page">
    <PageGuide
      title="Admin guide"
      description="Use this area to manage shared categories and control which users can access the app as regular members or admins."
      :tips="[
        'Only create categories users will consistently need.',
        'Use admin access sparingly so account changes stay deliberate.',
        'Review delete prompts carefully before removing users or categories.'
      ]"
    />

    <el-tabs v-model="activeTab">
      <el-tab-pane label="Categories" name="categories">
        <el-card shadow="hover">
          <div class="toolbar">
            <el-tooltip content="Create a new budget category for income or expenses" placement="top">
              <el-button type="primary" @click="openCategoryDialog()">Add category</el-button>
            </el-tooltip>
          </div>

          <el-table v-loading="loadingCategories" :data="categories" stripe class="admin-table">
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="slug" label="Slug" width="140" />
            <el-table-column prop="type" label="Type" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'income' ? 'success' : 'warning'" size="small">
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="defaultAllocation" label="Default allocation" width="160">
              <template #default="{ row }">{{ formatMoney(row.defaultAllocation) }}</template>
            </el-table-column>
            <el-table-column prop="order" label="Order" width="80" />
            <el-table-column label="Actions" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openCategoryDialog(row)">Edit</el-button>
                <el-button
                  v-if="!row.isSystem"
                  link
                  type="danger"
                  size="small"
                  @click="confirmDeleteCategory(row)"
                >
                  Delete
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="Users" name="users">
        <el-card shadow="hover">
          <div class="toolbar">
            <el-tooltip content="Create a new member or admin account" placement="top">
              <el-button type="primary" @click="openUserDialog()">Add user</el-button>
            </el-tooltip>
          </div>

          <el-table v-loading="loadingUsers" :data="users" stripe class="admin-table">
            <el-table-column prop="name" label="Name" min-width="180" />
            <el-table-column prop="email" label="Email" min-width="220" />
            <el-table-column label="Role" width="120">
              <template #default="{ row }">
                <el-tag :type="row.isAdmin ? 'danger' : 'info'" size="small">
                  {{ row.isAdmin ? 'Admin' : 'User' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Created" width="180">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="Actions" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openUserDialog(row)">Edit</el-button>
                <el-button
                  link
                  type="danger"
                  size="small"
                  :disabled="row.id === currentUserId || row._id === currentUserId"
                  @click="confirmDeleteUser(row)"
                >
                  Delete
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="categoryDialogVisible"
      :title="editingCategoryId ? 'Edit category' : 'Add category'"
      width="440px"
      @close="resetCategoryForm"
    >
      <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="140px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="categoryForm.name" placeholder="e.g. Tithes" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="categoryForm.slug" placeholder="e.g. tithes" :disabled="!!editingCategoryId" />
        </el-form-item>
        <el-form-item label="Type" prop="type">
          <el-radio-group v-model="categoryForm.type">
            <el-radio value="income">Income</el-radio>
            <el-radio value="expense">Expense</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Default allocation" prop="defaultAllocation">
          <el-input-number v-model="categoryForm.defaultAllocation" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Order" prop="order">
          <el-input-number v-model="categoryForm.order" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="savingCategory" @click="submitCategory">Save</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="userDialogVisible"
      :title="editingUserId ? 'Edit user' : 'Add user'"
      width="460px"
      @close="resetUserForm"
    >
      <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="110px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="userForm.name" placeholder="Full name" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="userForm.email" placeholder="name@example.com" />
        </el-form-item>
        <el-form-item :label="editingUserId ? 'Password' : 'Password'" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            show-password
            :placeholder="editingUserId ? 'Leave blank to keep current password' : 'At least 6 characters'"
          />
        </el-form-item>
        <el-form-item label="Admin access" prop="isAdmin">
          <el-switch v-model="userForm.isAdmin" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="savingUser" @click="submitUser">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import Swal from 'sweetalert2';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { createUser, deleteUser, getUsers, updateUser } from '../api/users';
import { getStoredUser, setStoredUser } from '../utils/auth';
import { formatMoney } from '../utils/format';
import PageGuide from '../components/PageGuide.vue';

const activeTab = ref('categories');

const loadingCategories = ref(false);
const categories = ref([]);
const categoryDialogVisible = ref(false);
const categoryFormRef = ref(null);
const editingCategoryId = ref(null);
const savingCategory = ref(false);

const loadingUsers = ref(false);
const users = ref([]);
const userDialogVisible = ref(false);
const userFormRef = ref(null);
const editingUserId = ref(null);
const savingUser = ref(false);

const currentUser = computed(() => getStoredUser() || {});
const currentUserId = computed(() => currentUser.value?.id || '');

const categoryForm = reactive({
  name: '',
  slug: '',
  type: 'expense',
  defaultAllocation: 0,
  order: 0,
});

const userForm = reactive({
  name: '',
  email: '',
  password: '',
  isAdmin: false,
});

const categoryRules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  slug: [{ required: true, message: 'Slug is required', trigger: 'blur' }],
  type: [{ required: true }],
};

const userRules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address', trigger: ['blur', 'change'] },
  ],
  password: [
    {
      validator: (_, value, callback) => {
        if (!editingUserId.value && !value) {
          callback(new Error('Password is required'));
          return;
        }
        if (value && value.length < 6) {
          callback(new Error('Password must be at least 6 characters'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

async function loadCategories() {
  loadingCategories.value = true;
  try {
    const { data } = await getCategories();
    categories.value = Array.isArray(data) ? data : [];
  } catch {
    categories.value = [];
  } finally {
    loadingCategories.value = false;
  }
}

async function loadUsers() {
  loadingUsers.value = true;
  try {
    const { data } = await getUsers();
    users.value = Array.isArray(data) ? data : [];
  } catch {
    users.value = [];
  } finally {
    loadingUsers.value = false;
  }
}

function openCategoryDialog(row) {
  editingCategoryId.value = row?._id ?? null;
  if (row) {
    categoryForm.name = row.name;
    categoryForm.slug = row.slug;
    categoryForm.type = row.type;
    categoryForm.defaultAllocation = row.defaultAllocation ?? 0;
    categoryForm.order = row.order ?? 0;
  }
  categoryDialogVisible.value = true;
}

function resetCategoryForm() {
  editingCategoryId.value = null;
  categoryForm.name = '';
  categoryForm.slug = '';
  categoryForm.type = 'expense';
  categoryForm.defaultAllocation = 0;
  categoryForm.order = 0;
}

async function submitCategory() {
  const isValid = await categoryFormRef.value?.validate().catch(() => false);
  if (isValid === false) return;

  savingCategory.value = true;
  try {
    if (editingCategoryId.value) {
      await updateCategory(editingCategoryId.value, {
        name: categoryForm.name,
        type: categoryForm.type,
        defaultAllocation: categoryForm.defaultAllocation,
        order: categoryForm.order,
      });
      ElMessage.success('Category updated');
    } else {
      await createCategory({
        ...categoryForm,
        slug: categoryForm.slug.toLowerCase().replace(/\s+/g, '-'),
      });
      ElMessage.success('Category created');
    }
    categoryDialogVisible.value = false;
    await loadCategories();
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Save failed');
  } finally {
    savingCategory.value = false;
  }
}

async function confirmDeleteCategory(row) {
  const result = await Swal.fire({
    title: 'Delete category?',
    text: `This will remove "${row.name}". Existing records linked to it may block the delete.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    confirmButtonColor: '#dc2626',
  });

  if (!result.isConfirmed) return;

  try {
    await deleteCategory(row._id);
    ElMessage.success('Category deleted');
    await loadCategories();
  } catch (e) {
    await Swal.fire({
      title: 'Delete failed',
      text: e.response?.data?.message || 'The category could not be deleted.',
      icon: 'error',
    });
  }
}

function openUserDialog(row) {
  editingUserId.value = row?._id ?? row?.id ?? null;
  if (row) {
    userForm.name = row.name;
    userForm.email = row.email;
    userForm.password = '';
    userForm.isAdmin = !!row.isAdmin;
  }
  userDialogVisible.value = true;
}

function resetUserForm() {
  editingUserId.value = null;
  userForm.name = '';
  userForm.email = '';
  userForm.password = '';
  userForm.isAdmin = false;
}

async function submitUser() {
  const isValid = await userFormRef.value?.validate().catch(() => false);
  if (isValid === false) return;

  savingUser.value = true;
  try {
    const payload = {
      name: userForm.name,
      email: userForm.email,
      isAdmin: userForm.isAdmin,
    };

    if (userForm.password) {
      payload.password = userForm.password;
    }

    if (editingUserId.value) {
      const { data } = await updateUser(editingUserId.value, payload);
      if ((data?.user?.id || data?.user?._id) === currentUserId.value) {
        setStoredUser(data.user);
      }
      ElMessage.success('User updated');
    } else {
      await createUser(payload);
      ElMessage.success('User created');
    }

    userDialogVisible.value = false;
    await loadUsers();
  } catch (e) {
    await Swal.fire({
      title: 'Save failed',
      text: e.response?.data?.message || 'The user could not be saved.',
      icon: 'error',
    });
  } finally {
    savingUser.value = false;
  }
}

async function confirmDeleteUser(row) {
  const result = await Swal.fire({
    title: 'Delete user?',
    text: `This will permanently remove ${row.name}'s account.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    confirmButtonColor: '#dc2626',
  });

  if (!result.isConfirmed) return;

  try {
    await deleteUser(row._id ?? row.id);
    ElMessage.success('User deleted');
    await loadUsers();
  } catch (e) {
    await Swal.fire({
      title: 'Delete failed',
      text: e.response?.data?.message || 'The user could not be deleted.',
      icon: 'error',
    });
  }
}

onMounted(() => {
  loadCategories();
  loadUsers();
});
</script>

<style scoped>
.admin-page {
  max-width: 1100px;
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.admin-table {
  width: 100%;
}

@media (max-width: 768px) {
  .admin-page {
    max-width: none;
  }

  .toolbar {
    justify-content: stretch;
  }

  .toolbar :deep(.el-button) {
    width: 100%;
  }

  :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }
}
</style>
