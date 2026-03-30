<template>
  <div class="dashboard">
    <el-alert
      v-if="showChecklist"
      title="Quick start checklist"
      type="success"
      show-icon
      :closable="false"
      class="quick-start"
    >
      <template #default>
        <p class="quick-start-description">
          New to Budget Planner? Work through these steps once to get your dashboard working for you.
        </p>
        <ol class="quick-start-list">
          <li>Create or review your categories in Admin if you need custom budget groups.</li>
          <li>Open Monthly Plan and set your target income plus category allocations.</li>
          <li>Add your income and expense transactions so the dashboard reflects real activity.</li>
          <li>Visit Reports to compare months and export your records.</li>
        </ol>
        <div class="quick-start-actions">
          <el-button type="primary" size="small" @click="dismissChecklist">Got it</el-button>
        </div>
      </template>
    </el-alert>

    <PageGuide
      title="How to use the dashboard"
      description="This page gives you a quick month-by-month snapshot of your plan versus your actual spending."
      :tips="[
        'Switch months from the dropdown to review previous budget cycles.',
        'Use Remaining to spot how much of your target income is still available.',
        'Check the category chart to quickly find overspending areas.'
      ]"
    />

    <div class="month-selector">
      <el-tooltip content="Review another month without leaving the dashboard" placement="top">
        <el-select v-model="monthKey" placeholder="Select month" @change="loadSummary" style="width: 180px">
          <el-option
            v-for="m in monthOptions"
            :key="m.value"
            :label="m.label"
            :value="m.value"
          />
        </el-select>
      </el-tooltip>
    </div>

    <el-row :gutter="20" class="summary-cards">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card income">
          <div class="stat-label">Income target</div>
          <div class="stat-value">{{ formatMoney(summary.incomeTarget) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">Allocated</div>
          <div class="stat-value">{{ formatMoney(summary.allocatedTotal) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card spent">
          <div class="stat-label">Spent</div>
          <div class="stat-value">{{ formatMoney(summary.expenseTotal) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card remaining">
          <div class="stat-label">Remaining</div>
          <div class="stat-value">{{ formatMoney(summary.totalRemaining ?? 0) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>Allocation vs spent by category</template>
          <div class="chart-wrap">
            <v-chart v-if="categoryChartOption" :option="categoryChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>Category breakdown (amounts)</template>
          <el-table :data="summary.categoryBreakdown" size="small" max-height="320">
            <el-table-column prop="category.name" label="Category" />
            <el-table-column label="Allocated" width="100">
              <template #default="{ row }">{{ formatMoney(row.allocated) }}</template>
            </el-table-column>
            <el-table-column label="Spent" width="100">
              <template #default="{ row }">{{ formatMoney(row.spent) }}</template>
            </el-table-column>
            <el-table-column label="Remaining" width="100">
              <template #default="{ row }">
                <span :class="row.remaining >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatMoney(row.remaining) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { getBudgetSummary } from '../api/budgets';
import { formatMoney } from '../utils/format';
import { getMonthKey, getRecentMonthOptions } from '../utils/month';
import PageGuide from '../components/PageGuide.vue';

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent]);

const CHECKLIST_STORAGE_KEY = 'dashboard_quick_start_dismissed';
const monthKey = ref(getCurrentMonthKey());
const showChecklist = ref(localStorage.getItem(CHECKLIST_STORAGE_KEY) !== 'true');
const summary = ref({
  incomeTarget: 0,
  allocatedTotal: 0,
  expenseTotal: 0,
  totalRemaining: 0,
  categoryBreakdown: [],
});

const monthOptions = computed(() => {
  return getRecentMonthOptions(12, 'long');
});

const categoryChartOption = computed(() => {
  const data = summary.value.categoryBreakdown || [];
  const names = data.map((d) => d.category?.name || '—');
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 10, containLabel: true },
    xAxis: { type: 'category', data: names, axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: 'Amount' },
    series: [
      { name: 'Allocated', type: 'bar', data: data.map((d) => d.allocated), itemStyle: { color: '#1a73e8' } },
      { name: 'Spent', type: 'bar', data: data.map((d) => d.spent), itemStyle: { color: '#34a853' } },
    ],
  };
});

function getCurrentMonthKey() {
  return getMonthKey(new Date());
}

function dismissChecklist() {
  localStorage.setItem(CHECKLIST_STORAGE_KEY, 'true');
  showChecklist.value = false;
}

async function loadSummary() {
  try {
    const { data } = await getBudgetSummary(monthKey.value);
    summary.value = data;
  } catch {
    summary.value = {
      incomeTarget: 0,
      allocatedTotal: 0,
      expenseTotal: 0,
      totalRemaining: 0,
      categoryBreakdown: [],
    };
  }
}

onMounted(loadSummary);
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}
.quick-start {
  margin-bottom: 20px;
}
.quick-start-description {
  margin: 0 0 8px;
  line-height: 1.5;
}
.quick-start-list {
  margin: 0;
  padding-left: 18px;
  line-height: 1.6;
  color: #475569;
}
.quick-start-actions {
  margin-top: 12px;
}
.month-selector {
  margin-bottom: 20px;
}
.summary-cards {
  margin-bottom: 20px;
}
.stat-card {
  margin-bottom: 16px;
}
.stat-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}
.stat-card.income .stat-value { color: #1a73e8; }
.stat-card.spent .stat-value { color: #ea4335; }
.stat-card.remaining .stat-value { color: #34a853; }
.chart-card {
  margin-bottom: 20px;
}
.chart-wrap {
  height: 280px;
}
.text-success { color: #34a853; }
.text-danger { color: #ea4335; }

@media (max-width: 768px) {
  .dashboard {
    max-width: none;
  }

  .quick-start {
    margin-bottom: 16px;
  }

  .chart-wrap {
    height: 240px;
  }
}
</style>
