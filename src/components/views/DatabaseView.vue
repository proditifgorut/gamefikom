<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Database: {{ database }}</h2>
    
    <div class="bg-white border border-gray-200 rounded-lg">
      <div class="p-4 border-b flex justify-between items-center">
        <h3 class="text-lg font-medium text-gray-900">Tables</h3>
        <button 
          @click="$emit('change-tab', 'new')"
          class="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusCircle class="w-4 h-4" />
          Create new table
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left font-semibold p-3">Table</th>
              <th class="text-left font-semibold p-3">Engine</th>
              <th class="text-left font-semibold p-3">Collation</th>
              <th class="text-right font-semibold p-3">Rows</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="table in tables" :key="table.name" class="border-b hover:bg-gray-50">
              <td class="p-3 flex items-center gap-2">
                <Table class="w-4 h-4 text-gray-500" />
                <span class="font-medium text-blue-600">{{ table.name }}</span>
              </td>
              <td class="p-3">{{ table.engine }}</td>
              <td class="p-3">{{ table.collation }}</td>
              <td class="p-3 text-right font-mono">{{ table.rows }}</td>
            </tr>
            <tr v-if="tables.length === 0">
              <td colspan="4" class="p-4 text-center text-gray-500">No tables in this database.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Table, PlusCircle } from 'lucide-vue-next';
import { reactiveMockServer } from '../../services/apiService';
import type { TableDetails } from '../../types';

const props = defineProps<{
  database: string;
}>();

defineEmits<{
  (e: 'change-tab', tabId: string): void;
}>();

const tables = computed<TableDetails[]>(() => {
  if (!props.database || !reactiveMockServer.value || !reactiveMockServer.value[props.database]) {
    return [];
  }
  return Object.values(reactiveMockServer.value[props.database]);
});
</script>
