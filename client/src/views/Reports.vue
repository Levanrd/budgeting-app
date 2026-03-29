<template>
  <div class="reports-page">
    <PageGuide
      title="How to use reports"
      description="Reports help you compare spending patterns across months and export your records when you need a file copy."
      :tips="[
        'Use the month filter to isolate category trends for one budget cycle.',
        'Monthly comparison is best for spotting changes in income versus expenses.',
        'Exports are useful for sharing or keeping an offline record.'
      ]"
    />

    <div class="toolbar">
      <el-select v-model="reportMonth" placeholder="Month (for trends)" clearable style="width: 180px" @change="loadTrends">
        <el-option
          v-for="m in monthOptions"
          :key="m.value"
          :label="m.label"
          :value="m.value"
        />
      </el-select>
      <el-select v-model="comparisonMonths" placeholder="Months to compare" style="width: 160px" @change="loadComparison">
        <el-option :value="3" label="Last 3 months" />
        <el-option :value="6" label="Last 6 months" />
        <el-option :value="12" label="Last 12 months" />
      </el-select>
      <el-tooltip content="Download your filtered transaction list as a spreadsheet-friendly file" placement="top">
        <el-button type="success" :loading="exportingCsv" @click="doExportCsv">Export CSV</el-button>
      </el-tooltip>
      <el-tooltip content="Generate a printable PDF summary for the selected month or all records" placement="top">
        <el-button type="primary" :loading="exportingPdf" @click="doExportPdf">Export PDF</el-button>
      </el-tooltip>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>Monthly comparison (income vs expense)</template>
          <div class="chart-wrap">
            <v-chart v-if="comparisonChartOption" :option="comparisonChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>Category spending trends</template>
          <div class="chart-wrap">
            <v-chart v-if="trendsChartOption" :option="trendsChartOption" autoresize />
          </div>
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
import { BarChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { getMonthlyComparison, getCategoryTrends, exportCsv, exportPdf } from '../api/reports';
import PageGuide from '../components/PageGuide.vue';

use([CanvasRenderer, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent]);

const reportMonth = ref('');
const comparisonMonths = ref(6);
const monthlyData = ref([]);
const trendsData = ref([]);
const exportingCsv = ref(false);
const exportingPdf = ref(false);

const monthOptions = (() => {
  const opts = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    opts.push({ value, label: date.toLocaleString('default', { month: 'short', year: 'numeric' }) });
  }
  return opts;
})();

const comparisonChartOption = computed(() => {
  const data = monthlyData.value || [];
  const labels = data.map((d) => {
    const [y, m] = d.monthKey.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
  });
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Income', 'Expense', 'Net'] },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', name: 'Amount (₱)' },
    series: [
      { name: 'Income', type: 'bar', data: data.map((d) => d.income), itemStyle: { color: '#34a853' } },
      { name: 'Expense', type: 'bar', data: data.map((d) => d.expense), itemStyle: { color: '#ea4335' } },
      { name: 'Net', type: 'line', data: data.map((d) => d.net), itemStyle: { color: '#1a73e8' } },
    ],
  };
});

const trendsChartOption = computed(() => {
  const data = trendsData.value || [];
  if (data.length === 0) return null;
  return {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: data.map((d) => ({ name: d.categoryName, value: d.total })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
      },
    ],
  };
});

async function loadComparison() {
  try {
    const { data } = await getMonthlyComparison(comparisonMonths.value);
    monthlyData.value = data;
  } catch {
    monthlyData.value = [];
  }
}

async function loadTrends() {
  try {
    const { data } = await getCategoryTrends(reportMonth.value || undefined);
    trendsData.value = data;
  } catch {
    trendsData.value = [];
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function doExportCsv() {
  exportingCsv.value = true;
  try {
    const { data } = await exportCsv(reportMonth.value || undefined);
    downloadBlob(data, `transactions${reportMonth.value ? `-${reportMonth.value}` : ''}.csv`);
  } catch {
    // ignore
  } finally {
    exportingCsv.value = false;
  }
}

async function doExportPdf() {
  exportingPdf.value = true;
  try {
    const { data } = await exportPdf(reportMonth.value || undefined);
    downloadBlob(data, `report${reportMonth.value ? `-${reportMonth.value}` : ''}.pdf`);
  } catch {
    // ignore
  } finally {
    exportingPdf.value = false;
  }
}

onMounted(() => {
  loadComparison();
  loadTrends();
});
</script>

<style scoped>
.reports-page {
  max-width: 1000px;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.chart-card {
  margin-bottom: 20px;
}
.chart-wrap {
  height: 320px;
}

@media (max-width: 768px) {
  .reports-page {
    max-width: none;
  }

  .chart-wrap {
    height: 260px;
  }
}
</style>
