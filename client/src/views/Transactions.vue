<template>
  <div class="transactions-page">
    <PageGuide
      title="How to manage transactions"
      description="Record every income and expense here so your dashboard and reports stay accurate."
      :tips="[
        'Use filters to focus on one month or one transaction type.',
        'Add transactions as they happen so totals stay current.',
        'Edit incorrect entries instead of creating duplicates.'
      ]"
    />

    <div class="toolbar">
      <el-select
        v-model="filterMonth"
        placeholder="Month"
        clearable
        style="width: 160px"
        @change="load"
      >
        <el-option
          v-for="m in monthOptions"
          :key="m.value"
          :label="m.label"
          :value="m.value"
        />
      </el-select>

      <el-select
        v-model="filterType"
        placeholder="Type"
        clearable
        style="width: 120px"
        @change="load"
      >
        <el-option label="Income" value="income" />
        <el-option label="Expense" value="expense" />
      </el-select>

      <el-tooltip content="Add a new income or expense entry" placement="top">
        <el-button type="primary" @click="openDialog()">Add transaction</el-button>
      </el-tooltip>
    </div>

    <el-card shadow="hover" class="transactions-card">
      <el-table
        v-loading="loading"
        :data="paginatedTransactions"
        stripe
        class="transactions-table"
        @sort-change="handleSortChange"
      >
        <el-table-column
          prop="date"
          label="Date"
          width="120"
          sortable="custom"
        >
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

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="sortedTransactions.length"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
      />
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
import { ElMessage } from 'element-plus';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../api/transactions';
import { getCategories } from '../api/categories';
import { formatMoney } from '../utils/format';
import { getRecentMonthOptions } from '../utils/month';
import PageGuide from '../components/PageGuide.vue';

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const transactions = ref([]);
const categories = ref([]);

const filterMonth = ref('');
const filterType = ref('');

const currentPage = ref(1);
const pageSize = ref(10);

const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);

const formRef = ref(null);
const editingId = ref(null);
const deleteId = ref(null);

// default sort: createdAt newest first
const sortState = ref({
  prop: 'createdAt',
  order: 'descending',
});

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

const monthOptions = getRecentMonthOptions(12, 'long');

watch(
  () => form.type,
  () => {
    form.category = '';
  }
);

watch(pageSize, () => {
  currentPage.value = 1;
});

function formatDate(d) {
  return new Date(d).toLocaleDateString();
}

// sorted list (default createdAt desc, but user can sort by date)
const sortedTransactions = computed(() => {
  const data = [...transactions.value];
  const { prop, order } = sortState.value || {};

  if (!prop || !order) return data;

  return data.sort((a, b) => {
    let valA = a?.[prop];
    let valB = b?.[prop];

    // date fields
    if (prop === 'date' || prop === 'createdAt') {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (order === 'ascending') return valA > valB ? 1 : -1;
    if (order === 'descending') return valA < valB ? 1 : -1;
    return 0;
  });
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedTransactions.value.slice(start, start + pageSize.value);
});

function handleSortChange({ prop, order }) {
  // if user clears sorting, revert to default createdAt desc
  if (!prop || !order) {
    sortState.value = { prop: 'createdAt', order: 'descending' };
    return;
  }
  sortState.value = { prop, order };
  currentPage.value = 1;
}

async function load() {
  loading.value = true;
  try {
    const params = {};
    if (filterMonth.value) params.monthKey = filterMonth.value;
    if (filterType.value) params.type = filterType.value;

    const { data } = await getTransactions(params);

    transactions.value = Array.isArray(data) ? data : [];
    currentPage.value = 1;

    // keep default sort unless user has actively chosen another sort
    // (if you want load() to ALWAYS reset sort, uncomment next line)
    // sortState.value = { prop: 'createdAt', order: 'descending' };
  } catch {
    transactions.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  const { data } = await getCategories();
  categories.value = Array.isArray(data) ? data : [];
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
    await load();
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || 'Save failed');
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
    await load();
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
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
.text-income { color: #34a853; }
.text-expense { color: #ea4335; }

@media (max-width: 768px) {
  .transactions-page {
    max-width: none;
  }

  .transactions-card {
    overflow: hidden;
  }

  .transactions-table {
    width: 100%;
  }

  :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }

  .pagination {
    justify-content: flex-start;
  }
}
</style>
