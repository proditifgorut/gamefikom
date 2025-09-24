<template>
  <div>
    <div v-if="!table" class="text-center py-12">
      <Table class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Table Selected</h3>
      <p class="text-gray-600">Choose a table from the navigation to view its structure.</p>
    </div>

    <div v-else class="space-y-8">
      <div>
        <h2 class="text-xl font-semibold text-gray-800">Table structure: {{ table }}</h2>
        <p v-if="tableDetails" class="text-sm text-gray-600 mt-1">
          {{ tableDetails.rows }} rows • {{ tableDetails.engine }} engine • {{ tableDetails.collation }} collation
        </p>
      </div>

      <div class="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr class="border-b border-gray-300">
                <th class="text-left py-2 px-3 font-semibold text-gray-600 uppercase">Column</th>
                <th class="text-left py-2 px-3 font-semibold text-gray-600 uppercase">Type</th>
                <th class="text-left py-2 px-3 font-semibold text-gray-600 uppercase">Null</th>
                <th class="text-left py-2 px-3 font-semibold text-gray-600 uppercase">Key</th>
                <th class="text-left py-2 px-3 font-semibold text-gray-600 uppercase">Default</th>
                <th class="text-left py-2 px-3 font-semibold text-gray-600 uppercase">Extra</th>
                <th class="text-left py-2 px-3 font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody v-if="tableDetails">
              <tr 
                v-for="(column, index) in tableDetails.schema" 
                :key="column.name"
                :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'"
                class="border-b border-gray-200 last:border-b-0 hover:bg-blue-50"
              >
                <td class="py-2 px-3 font-medium text-gray-800">{{ column.name }}</td>
                <td class="py-2 px-3 font-mono text-gray-700">{{ column.type }}</td>
                <td class="py-2 px-3">{{ column.null ? 'YES' : 'NO' }}</td>
                <td class="py-2 px-3">
                  <span v-if="column.key === 'PRI'" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><Key class="w-3 h-3 mr-1" />PRIMARY</span>
                  <span v-else-if="column.key === 'UNI'" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">UNIQUE</span>
                  <span v-else-if="column.key === 'MUL'" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">INDEX</span>
                </td>
                <td class="py-2 px-3">
                  <span v-if="column.default" class="font-mono">{{ column.default }}</span>
                  <span v-else class="text-gray-400 italic">NULL</span>
                </td>
                <td class="py-2 px-3 text-blue-600 font-medium">{{ column.extra }}</td>
                <td class="py-2 px-3">
                  <button @click="handleDropColumn(column.name)" class="text-red-500 hover:text-red-700"><Trash2 class="w-4 h-4" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Add Column -->
      <form @submit.prevent="handleAddColumn" class="bg-white border border-gray-200 rounded-lg p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-3">Add new column</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input v-model="newColumn.name" type="text" class="form-input w-full" required />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select v-model="newColumn.type" class="form-select w-full">
              <option v-for="t in dataTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Length</label>
            <input v-model="newColumn.length" type="text" class="form-input w-full" />
          </div>
          <div class="self-end">
            <button type="submit" class="w-full px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">
              Add Column
            </button>
          </div>
        </div>
      </form>
    </div>
    
    <ConfirmModal 
      v-if="showConfirmModal"
      :title="confirmModalContent.title"
      :message="confirmModalContent.message"
      @confirm="confirmAction"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Table, Key, Trash2 } from 'lucide-vue-next';
import { reactiveMockServer } from '../../services/apiService';
import type { TableDetails } from '../../types';
import ConfirmModal from '../modals/ConfirmModal.vue';

const props = defineProps<{
  database: string;
  table: string;
}>();

const emit = defineEmits<{
  (e: 'executeQuery', query: string): void;
}>();

const tableDetails = computed<TableDetails | null>(() => {
  if (!props.database || !props.table || !reactiveMockServer.value) return null;
  const db = reactiveMockServer.value[props.database];
  if (!db) return null;
  return db[props.table] || null;
});

// Add column state
const dataTypes = ['INT', 'VARCHAR', 'TEXT', 'DATE', 'TIMESTAMP', 'BOOLEAN', 'DECIMAL', 'FLOAT', 'JSON'];
const createNewColumn = () => ({ name: '', type: 'VARCHAR', length: '255' });
const newColumn = ref(createNewColumn());

const handleAddColumn = () => {
  if (!newColumn.value.name.trim()) return;
  let query = `ALTER TABLE \`${props.table}\` ADD COLUMN \`${newColumn.value.name}\` ${newColumn.value.type}`;
  if (newColumn.value.length && ['VARCHAR', 'INT'].includes(newColumn.value.type)) {
    query += `(${newColumn.value.length})`;
  }
  query += ';';
  emit('executeQuery', query);
  newColumn.value = createNewColumn();
};

// Modal state
const showConfirmModal = ref(false);
const confirmModalContent = ref({ title: '', message: '' });
const actionToConfirm = ref<(() => void) | null>(null);

const handleDropColumn = (columnName: string) => {
  confirmModalContent.value = {
    title: 'Drop Column',
    message: `Are you sure you want to drop the column \`${columnName}\`? This action cannot be undone.`
  };
  actionToConfirm.value = () => {
    const query = `ALTER TABLE \`${props.table}\` DROP COLUMN \`${columnName}\`;`;
    emit('executeQuery', query);
  };
  showConfirmModal.value = true;
};

const confirmAction = () => {
  if (actionToConfirm.value) {
    actionToConfirm.value();
  }
  showConfirmModal.value = false;
  actionToConfirm.value = null;
};
</script>

<style scoped>
.form-input, .form-select {
  @apply border-gray-300 rounded-md shadow-sm text-sm p-1.5 focus:border-blue-500 focus:ring-blue-500;
}
</style>
