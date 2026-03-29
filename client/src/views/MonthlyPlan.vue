<template>
  <div class="plan-page">
    <PageGuide
      title="How to build your monthly plan"
      description="Set your target income first, then distribute that amount across the categories you expect to spend from."
      :tips="[
        'Use fixed amounts for predictable categories like bills or debt.',
        'Watch the remaining amount so you do not over-allocate your income.',
        'Update the plan each month before adding new expenses.'
      ]"
    />

    <div class="toolbar">
      <el-select v-model="monthKey" placeholder="Month" style="width: 200px" @change="load">
        <el-option
          v-for="m in monthOptions"
          :key="m.value"
          :label="m.label"
          :value="m.value"
        />
      </el-select>
      <el-tooltip content="Save this month’s budget plan and category allocations" placement="top">
        <el-button type="primary" :loading="saving" @click="savePlan">Save plan</el-button>
      </el-tooltip>
    </div>

    <el-card shadow="hover" class="plan-card">
      <template #header>Monthly income target</template>
      <el-form label-position="top">
        <el-form-item label="Income target for this month (₱)">
          <el-input-number
            v-model="incomeTarget"
            :min="0"
            :precision="2"
            :step="100"
            size="large"
            style="width: 220px"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="plan-card">
      <template #header>Category allocations (fixed amounts)</template>
      <p class="hint">Set how much you want to allocate to each category. Use exact amounts.</p>
      <el-table :data="allocations" style="margin-top: 12px">
        <el-table-column prop="name" label="Category" />
        <el-table-column label="Allocated amount (₱)" width="200">
          <template #default="{ row }">
            <el-input-number
              v-model="row.amount"
              :min="0"
              :precision="2"
              size="small"
              style="width: 140px"
            />
          </template>
        </el-table-column>
      </el-table>
      <div class="totals">
        <span>Total allocated: <strong>{{ formatMoney(totalAllocated) }}</strong></span>
        <span class="remaining">Remaining to allocate: <strong>{{ formatMoney(incomeTarget - totalAllocated) }}</strong></span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getBudgets, getBudgetSummary, saveBudget } from '../api/budgets';
import { getCategories } from '../api/categories';
import { formatMoney } from '../utils/format';
import PageGuide from '../components/PageGuide.vue';

const monthKey = ref(getCurrentMonthKey());
const incomeTarget = ref(0);
const allocations = ref([]);
const expenseCategories = ref([]); // all categories (expense + income for future use)
const saving = ref(false);

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

const totalAllocated = computed(() =>
  allocations.value.reduce((sum, a) => sum + (Number(a.amount) || 0), 0)
);

function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function loadCategories() {
  const { data } = await getCategories();
  expenseCategories.value = data.filter((c) => c.type === 'expense' || c.type === 'income');
}

async function load() {
  await loadCategories();
  try {
    const [budgetRes, summaryRes] = await Promise.all([
      getBudgets({ monthKey: monthKey.value }),
      getBudgetSummary(monthKey.value),
    ]);
    const budget = budgetRes.data[0];
    const summary = summaryRes.data;
    incomeTarget.value = budget?.incomeTarget ?? summary?.incomeTarget ?? 0;
    const expenseCats = expenseCategories.value.filter((c) => c.type === 'expense');
    const existingMap = {};
    (budget?.allocations || []).forEach((a) => {
      const cid = a.category?._id?.toString?.() || a.category;
      existingMap[cid] = a.amount;
    });
    allocations.value = expenseCats.map((c) => ({
      _id: c._id,
      name: c.name,
      type: 'expense',
      amount: existingMap[c._id] ?? c.defaultAllocation ?? 0,
    }));
  } catch {
    const expenseCats = expenseCategories.value.filter((c) => c.type === 'expense');
    allocations.value = expenseCats.map((c) => ({
      _id: c._id,
      name: c.name,
      type: 'expense',
      amount: c.defaultAllocation ?? 0,
    }));
  }
}

async function savePlan() {
  saving.value = true;
  try {
    const allocationPayload = allocations.value
      .filter((a) => (Number(a.amount) || 0) > 0)
      .map((a) => ({ category: a._id, amount: Number(a.amount) || 0 }));
    await saveBudget({
      monthKey: monthKey.value,
      incomeTarget: Number(incomeTarget.value) || 0,
      allocations: allocationPayload,
    });
    ElMessage.success('Plan saved');
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Save failed');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.plan-page {
  max-width: 700px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}
.plan-card {
  margin-bottom: 20px;
}
.hint {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
}
.totals {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 24px;
}
.remaining {
  color: #1a73e8;
}
.muted {
  color: #94a3b8;
}

@media (max-width: 768px) {
  .plan-page {
    max-width: none;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .totals {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
