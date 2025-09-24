<template>
  <div class="max-w-4xl mx-auto">
    <h2 class="text-xl font-semibold text-gray-800 mb-2">Insert into table `{{ table }}`</h2>
    
    <form @submit.prevent="handleInsert" class="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div class="border border-gray-200 rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="p-2 text-left font-semibold">Column</th>
              <th class="p-2 text-left font-semibold">Type</th>
              <th class="p-2 text-left font-semibold">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="col in insertableColumns" :key="col.name" class="border-b last:border-0">
              <td class="p-2 font-medium">{{ col.name }}</td>
              <td class="p-2 text-gray-600 font-mono">{{ col.type }}</td>
              <td class="p-2">
                <input 
                  v-model="newRow[col.name]"
                  :type="getInputType(col.type)"
                  class="w-full form-input"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end gap-4 pt-4 border-t">
        <button type="button" @click="$emit('change-tab', 'browse')" class="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
        <button type="submit" class="px-6 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Insert</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { reactiveMockServer } from '../../services/apiService';

const props = defineProps<{
  database: string;
  table: string;
}>();

const emit = defineEmits<{
  (e: 'executeQuery', query: string): void;
  (e: 'change-tab', tabId: string): void;
}>();

const tableDetails = computed(() => {
  if (!props.database || !props.table || !reactiveMockServer.value) return null;
  return reactiveMockServer.value[props.database]?.[props.table] || null;
});

const insertableColumns = computed(() => {
  return tableDetails.value?.schema.filter(col => col.extra !== 'AUTO_INCREMENT') || [];
});

const newRow = ref<Record<string, any>>({});

const getInputType = (sqlType: string): string => {
  const type = sqlType.toLowerCase();
  if (type.includes('int') || type.includes('decimal') || type.includes('float')) return 'number';
  if (type.includes('date')) return 'date';
  if (type.includes('time')) return 'datetime-local';
  return 'text';
};

const handleInsert = () => {
  if (!tableDetails.value) return;

  const columns = Object.keys(newRow.value).filter(key => newRow.value[key] !== '' && newRow.value[key] !== null);
  if (columns.length === 0) {
    alert('Please provide a value for at least one column.');
    return;
  }

  const columnNames = columns.map(c => `\`${c}\``).join(', ');
  const columnValues = columns.map(c => `'${String(newRow.value[c]).replace(/'/g, "''")}'`).join(', ');

  const query = `INSERT INTO \`${props.table}\` (${columnNames}) VALUES (${columnValues});`;
  
  emit('executeQuery', query);
  emit('change-tab', 'browse');
};
</script>

<style scoped>
.form-input {
  @apply border-gray-300 rounded-md shadow-sm text-sm p-1.5 focus:border-blue-500 focus:ring-blue-500;
}
</style>
