<template>
  <div class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-800">Server Status</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
        <div class="p-3 bg-blue-100 rounded-full">
          <Clock class="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Uptime</p>
          <p class="text-lg font-semibold">{{ formattedUptime }}</p>
        </div>
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
        <div class="p-3 bg-green-100 rounded-full">
          <Database class="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Databases</p>
          <p class="text-lg font-semibold">{{ Object.keys(serverState || {}).length }}</p>
        </div>
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
        <div class="p-3 bg-indigo-100 rounded-full">
          <Table class="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Total Tables</p>
          <p class="text-lg font-semibold">{{ totalTables }}</p>
        </div>
      </div>
      <div class="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
        <div class="p-3 bg-purple-100 rounded-full">
          <BarChart class="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Queries Processed</p>
          <p class="text-lg font-semibold">{{ stats?.queriesProcessed || 0 }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="text-lg font-medium text-gray-900 mb-3">Server Information</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="font-semibold text-gray-600">Server Version:</div>
        <div>1.0.0 (MySQL Editor Demo)</div>
        <div class="font-semibold text-gray-600">Protocol Version:</div>
        <div>10</div>
        <div class="font-semibold text-gray-600">Server Charset:</div>
        <div>UTF-8 Unicode (utf8mb4)</div>
        <div class="font-semibold text-gray-600">Web Server:</div>
        <div>Vite / Mock Service Worker</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Clock, Database, Table, BarChart } from 'lucide-vue-next';
import { apiService, reactiveMockServer } from '../../services/apiService';

const stats = ref(apiService.getMockServerStats());
const intervalId = ref<number | null>(null);

const serverState = computed(() => reactiveMockServer.value);
const totalTables = computed(() => {
  if (!serverState.value) return 0;
  return Object.values(serverState.value).reduce((acc, db) => acc + Object.keys(db).length, 0);
});

const formattedUptime = computed(() => {
  if (!stats.value) return '0s';
  const totalSeconds = Math.floor(stats.value.uptime / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
});

onMounted(() => {
  intervalId.value = window.setInterval(() => {
    stats.value = apiService.getMockServerStats();
  }, 1000);
});

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }
});
</script>
