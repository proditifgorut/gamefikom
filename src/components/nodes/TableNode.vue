<template>
  <div class="bg-white border-2 border-gray-300 rounded-lg shadow-md w-52">
    <div class="bg-gray-200 p-2 border-b-2 border-gray-300 rounded-t-md">
      <h4 class="font-bold text-gray-800 text-sm truncate flex items-center gap-2">
        <Table class="w-4 h-4" />
        {{ table.name }}
      </h4>
    </div>
    <ul class="p-2 space-y-1 max-h-48 overflow-y-auto">
      <li v-for="col in table.schema" :key="col.name" class="text-xs text-gray-700 flex items-center gap-1.5">
        <Key v-if="col.key === 'PRI'" class="w-3 h-3 text-yellow-500 flex-shrink-0" />
        <Link v-else-if="col.references" class="w-3 h-3 text-blue-500 flex-shrink-0" />
        <div v-else class="w-3 h-3 flex-shrink-0"></div>
        <span class="truncate">{{ col.name }}</span>
        <span class="text-gray-400 truncate">{{ col.type }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { Table, Key, Link } from 'lucide-vue-next';
import type { TableDetails } from '../../types';

defineProps<{
  table: TableDetails;
}>();
</script>
