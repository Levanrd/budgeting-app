<template>
  <el-alert
    :title="title"
    type="info"
    :closable="false"
    show-icon
    class="page-guide"
  >
    <template #default>
      <p class="page-guide-description">{{ description }}</p>
      <ul v-if="tips?.length" class="page-guide-list">
        <li v-for="tip in tips" :key="tip">{{ tip }}</li>
      </ul>
    </template>
  </el-alert>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tips: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.page-guide {
  margin-bottom: 20px;
}

.page-guide-description {
  margin: 0 0 8px;
  line-height: 1.5;
}

.page-guide-list {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .page-guide {
    margin-bottom: 16px;
  }
}
</style>
