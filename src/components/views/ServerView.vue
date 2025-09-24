<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Server: localhost</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Database List -->
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-3">Databases</h3>
        <div class="max-h-96 overflow-y-auto">
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="db in databases" :key="db" class="border-b hover:bg-gray-50">
                <td class="p-2 flex items-center gap-2">
                  <Database class="w-4 h-4 text-gray-500" />
                  <span>{{ db }}</span>
                </td>
                <td class="p-2 text-right">
                  <span class="text-xs text-gray-500">{{ dbTableCounts[db] || 0 }} tables</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create New Database -->
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-3">Create new database</h3>
        <form @submit.prevent="createDatabase">
          <div class="flex items-center gap-2">
            <input 
              v-model="newDbName"
              type="text" 
              placeholder="database_name"
              class="flex-grow border-gray-300 rounded-md shadow-sm text-sm"
              required
            />
            <button type="submit" class="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Database } from 'lucide-vue-next';
import { reactiveMockServer } from '../../services/apiService';
import type { DatabaseConnection } from '../../types';

defineProps<{
  connection: DatabaseConnection | null,
}>();

const emit = defineEmits<{
  (e: 'executeQuery', query: string): void;
}>();

const serverState = computed(() => reactiveMockServer.value);
const databases = computed(() => serverState.value ? Object.keys(serverState.value) : []);
const dbTableCounts = computed(() => {
  const counts: Record<string, number> = {};
  if (serverState.value) {
    for (const dbName in serverState.value) {
      counts[dbName] = Object.keys(serverState.value[dbName]).length;
    }
  }
  return counts;
});

const newDbName = ref('');

const createDatabase = () => {
  if (!newDbName.value.trim()) return;
  const query = `CREATE DATABASE \`${newDbName.value.trim()}\`;`;
  emit('executeQuery', query);
  newDbName.value = '';
}
</script>
