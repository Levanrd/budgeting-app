<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import en from 'element-plus/dist/locale/en.mjs';
const locale = en;
</script>

<style>
:root {
  --app-bg: #f0f2f5;
  --card-bg: #fff;
  --primary: #1a73e8;
  --success: #34a853;
  --warning: #f9ab00;
  --danger: #ea4335;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--app-bg);
  color: #1f2937;
}
#app {
  min-height: 100vh;
}
</style>
