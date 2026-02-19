<template>
  <div class="transactions-page">
    <div class="toolbar">
      <el-select v-model="filterMonth" placeholder="Month" clearable style="width: 160px" @change="load">
        <el-option
          v-for="m in monthOptions"
          :key="m.value"
          :label="m.label"
          :value="m.value"
        />
      </el-select>
      <el-select v-model="filterType" placeholder="Type" clearable style="width: 120px" @change="load">
        <el-option label="Income" value="income" />
        <el-option label="Expense" value="expense" />
      </el-select>
      <el-button type="primary" @click="openDialog()">Add transaction</el-button>
    </div>

    <el-card shadow="hover">
      <el-table v-loading="loading" :data="transactions" stripe>
        <el-table-column prop="date" label="Date" width="120">
          <template #default="{ row }">{{ formatDate(row.date) }}</template>
        </el-table-column>
        <el-table-column prop="type" label="Type" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category.name" label="Category" />
        <el-table-column prop="amount" label="Amount" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'text-income' : 'text-expense'">
              {{ row.type === 'income' ? '+' : '-' }}{{ formatMoney(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="Description" show-overflow-tooltip />
        <el-table-column label="Actions" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">Edit</el-button>
            <el-button link type="danger" size="small" @click="confirmDelete(row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? 'Edit transaction' : 'Add transaction'"
      width="440px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="Type" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="income">Income</el-radio>
            <el-radio value="expense">Expense</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Category" prop="category">
          <el-select v-model="form.category" placeholder="Category" style="width: 100%" filterable>
            <el-option
              v-for="c in categoriesForType"
              :key="c._id"
              :label="c.name"
              :value="c._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Amount" prop="amount">
          <el-input-number v-model="form.amount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Date" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Description" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">Save</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="deleteDialogVisible" title="Delete transaction" width="400px">
      <p>Are you sure you want to delete this transaction?</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">Cancel</el-button>
        <el-button type="danger" :loading="deleting" @click="doDelete">Delete</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../api/transactions';
import { getCategories } from '../api/categories';
import { formatMoney } from '../utils/format';

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const transactions = ref([]);
const categories = ref([]);
const filterMonth = ref('');
const filterType = ref('');
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const formRef = ref(null);
const editingId = ref(null);
const deleteId = ref(null);

const form = reactive({
  type: 'expense',
  category: '',
  amount: 0.01,
  date: new Date().toISOString().slice(0, 10),
  description: '',
});

const categoriesForType = computed(() =>
  categories.value.filter((c) => c.type === form.type)
);

const rules = {
  type: [{ required: true }],
  category: [{ required: true, message: 'Select a category', trigger: 'change' }],
  amount: [{ required: true, message: 'Amount required', trigger: 'blur' }],
  date: [{ required: true, message: 'Date required', trigger: 'change' }],
};

const monthOptions = (() => {
  const opts = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    opts.push({ value, label: date.toLocaleString('default', { month: 'long', year: 'numeric' }) });
  }
  return opts;
})();

watch(
  () => form.type,
  () => {
    form.category = '';
  }
);

function formatDate(d) {
  return new Date(d).toLocaleDateString();
}

async function load() {
  loading.value = true;
  try {
    const params = {};
    if (filterMonth.value) params.monthKey = filterMonth.value;
    if (filterType.value) params.type = filterType.value;
    const { data } = await getTransactions(params);
    // Sort by date descending (newest first)
    transactions.value = data.reverse();
  } catch {
    transactions.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  const { data } = await getCategories();
  categories.value = data;
}

function openDialog(row) {
  editingId.value = row?._id ?? null;
  if (row) {
    form.type = row.type;
    form.category = row.category?._id ?? row.category;
    form.amount = row.amount;
    form.date = new Date(row.date).toISOString().slice(0, 10);
    form.description = row.description || '';
  }
  dialogVisible.value = true;
}

function resetForm() {
  editingId.value = null;
  form.type = 'expense';
  form.category = '';
  form.amount = 0.01;
  form.date = new Date().toISOString().slice(0, 10);
  form.description = '';
}

async function submitForm() {
  await formRef.value?.validate().catch(() => {});
  saving.value = true;
  try {
    const payload = {
      type: form.type,
      category: form.category,
      amount: form.amount,
      date: form.date,
      description: form.description,
    };
    if (editingId.value) {
      await updateTransaction(editingId.value, payload);
      ElMessage.success('Transaction updated');
    } else {
      await createTransaction(payload);
      ElMessage.success('Transaction added');
    }
    dialogVisible.value = false;
    load();
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Save failed');
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row) {
  deleteId.value = row._id;
  deleteDialogVisible.value = true;
}

async function doDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    await deleteTransaction(deleteId.value);
    ElMessage.success('Transaction deleted');
    deleteDialogVisible.value = false;
    deleteId.value = null;
    load();
  } catch {
    ElMessage.error('Delete failed');
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  load();
  loadCategories();
});
</script>

<style scoped>
.transactions-page {
  max-width: 1000px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.text-income { color: #34a853; }
.text-expense { color: #ea4335; }
</style>
