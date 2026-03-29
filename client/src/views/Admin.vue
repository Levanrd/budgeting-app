<template>
  <div class="admin-page">
    <PageGuide
      title="Admin guide"
      description="Use this area to manage shared categories and default allocations that shape the budgeting workflow for everyone."
      :tips="[
        'Only create categories users will consistently need.',
        'Set default allocations to speed up monthly planning.',
        'Avoid deleting categories that have already been used in reports.'
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
            <el-table-column prop="defaultAllocation" label="Default allocation" width="140">
              <template #default="{ row }">{{ formatMoney(row.defaultAllocation) }}</template>
            </el-table-column>
            <el-table-column prop="order" label="Order" width="80" />
            <el-table-column label="Actions" width="160">
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

    <el-dialog v-model="deleteCategoryDialogVisible" title="Delete category" width="400px">
      <p>Are you sure you want to delete this category? Transactions using it may be affected.</p>
      <template #footer>
        <el-button @click="deleteCategoryDialogVisible = false">Cancel</el-button>
        <el-button type="danger" :loading="deletingCategory" @click="doDeleteCategory">Delete</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { formatMoney } from '../utils/format';
import PageGuide from '../components/PageGuide.vue';

const activeTab = ref('categories');
const loadingCategories = ref(false);
const categories = ref([]);
const categoryDialogVisible = ref(false);
const deleteCategoryDialogVisible = ref(false);
const categoryFormRef = ref(null);
const editingCategoryId = ref(null);
const savingCategory = ref(false);
const deletingCategory = ref(false);
const categoryToDeleteId = ref(null);

const categoryForm = reactive({
  name: '',
  slug: '',
  type: 'expense',
  defaultAllocation: 0,
  order: 0,
});

const categoryRules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  slug: [{ required: true, message: 'Slug is required', trigger: 'blur' }],
  type: [{ required: true }],
};

async function loadCategories() {
  loadingCategories.value = true;
  try {
    const { data } = await getCategories();
    categories.value = data;
  } catch {
    categories.value = [];
  } finally {
    loadingCategories.value = false;
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
  await categoryFormRef.value?.validate().catch(() => {});
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
    loadCategories();
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Save failed');
  } finally {
    savingCategory.value = false;
  }
}

function confirmDeleteCategory(row) {
  categoryToDeleteId.value = row._id;
  deleteCategoryDialogVisible.value = true;
}

async function doDeleteCategory() {
  if (!categoryToDeleteId.value) return;
  deletingCategory.value = true;
  try {
    await deleteCategory(categoryToDeleteId.value);
    ElMessage.success('Category deleted');
    deleteCategoryDialogVisible.value = false;
    categoryToDeleteId.value = null;
    loadCategories();
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Delete failed');
  } finally {
    deletingCategory.value = false;
  }
}

onMounted(loadCategories);
</script>

<style scoped>
.admin-page {
  max-width: 900px;
}
.toolbar {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .admin-page {
    max-width: none;
  }

  :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }
}
</style>
