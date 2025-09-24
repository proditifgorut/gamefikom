<template>
  <div class="max-w-4xl mx-auto">
    <h2 class="text-xl font-semibold text-gray-800 mb-2">Create new table in database `{{ database }}`</h2>
    
    <form @submit.prevent="handleCreateTable" class="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <!-- Table Name -->
      <div>
        <label for="tableName" class="block text-sm font-medium text-gray-700 mb-1">Table name</label>
        <input 
          id="tableName"
          v-model="tableName"
          type="text" 
          required
          class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <!-- Columns -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-3">Columns</h3>
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="p-2 text-left font-semibold">Name</th>
                <th class="p-2 text-left font-semibold">Type</th>
                <th class="p-2 text-left font-semibold">Length/Values</th>
                <th class="p-2 text-left font-semibold">Default</th>
                <th class="p-2 text-left font-semibold">Index</th>
                <th class="p-2 text-center font-semibold">Null</th>
                <th class="p-2 text-center font-semibold">A_I</th>
                <th class="p-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(col, index) in columns" :key="col.id" class="border-b last:border-0">
                <td class="p-2"><input v-model="col.name" type="text" class="w-full form-input" required /></td>
                <td class="p-2">
                  <select v-model="col.type" class="w-full form-select">
                    <option v-for="t in dataTypes" :key="t" :value="t">{{ t }}</option>
                  </select>
                </td>
                <td class="p-2"><input v-model="col.length" type="text" class="w-24 form-input" /></td>
                <td class="p-2"><input v-model="col.defaultValue" type="text" class="w-full form-input" /></td>
                <td class="p-2">
                  <select v-model="col.index" class="w-full form-select">
                    <option value="">---</option>
                    <option value="PRIMARY">PRIMARY</option>
                    <option value="UNIQUE">UNIQUE</option>
                  </select>
                </td>
                <td class="p-2 text-center"><input v-model="col.isNull" type="checkbox" class="form-checkbox" /></td>
                <td class="p-2 text-center"><input v-model="col.isAutoIncrement" type="checkbox" class="form-checkbox" /></td>
                <td class="p-2">
                  <button type="button" @click="removeColumn(index)" class="text-red-500 hover:text-red-700">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button type="button" @click="addColumn" class="mt-3 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-md flex items-center gap-2">
          <Plus class="w-4 h-4" />
          Add column
        </button>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-4 pt-4 border-t">
        <button type="button" @click="$emit('change-tab', 'structure')" class="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
        <button type="submit" class="px-6 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Create Table</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Plus, Trash2 } from 'lucide-vue-next';

defineProps<{
  database: string;
}>();

const emit = defineEmits<{
  (e: 'executeQuery', query: string): void;
  (e: 'change-tab', tabId: string): void;
}>();

let columnIdCounter = 1;
const createNewColumn = () => ({
  id: columnIdCounter++,
  name: '',
  type: 'INT',
  length: '11',
  defaultValue: '',
  index: '',
  isNull: false,
  isAutoIncrement: false,
});

const tableName = ref('');
const columns = ref([createNewColumn()]);

const dataTypes = [
  'INT', 'VARCHAR', 'TEXT', 'DATE', 'TIMESTAMP', 'BOOLEAN', 'DECIMAL', 'FLOAT', 'JSON'
];

const addColumn = () => {
  columns.value.push(createNewColumn());
};

const removeColumn = (index: number) => {
  columns.value.splice(index, 1);
};

const handleCreateTable = () => {
  if (!tableName.value.trim() || columns.value.length === 0) {
    alert('Table name and at least one column are required.');
    return;
  }

  const columnDefs = columns.value.map(col => {
    let def = `\`${col.name}\` ${col.type}`;
    if (col.length && ['VARCHAR', 'INT', 'DECIMAL'].includes(col.type)) {
      def += `(${col.length})`;
    }
    if (!col.isNull) {
      def += ' NOT NULL';
    }
    if (col.isAutoIncrement) {
      def += ' AUTO_INCREMENT';
    }
    if (col.defaultValue) {
      def += ` DEFAULT '${col.defaultValue}'`;
    }
    if (col.index === 'UNIQUE') {
      def += ' UNIQUE';
    }
    return def;
  });

  const primaryKey = columns.value.find(c => c.index === 'PRIMARY');
  if (primaryKey) {
    columnDefs.push(`PRIMARY KEY (\`${primaryKey.name}\`)`);
  }

  const query = `CREATE TABLE \`${tableName.value.trim()}\` (${columnDefs.join(', ')});`;
  
  emit('executeQuery', query);
};
</script>

<style scoped>
.form-input, .form-select, .form-checkbox {
  @apply border-gray-300 rounded-md shadow-sm text-sm p-1.5 focus:border-blue-500 focus:ring-blue-500;
}
.form-checkbox {
  @apply h-4 w-4;
}
</style>
