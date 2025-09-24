<template>
  <div>
    <div v-if="!table" class="text-center py-12">
      <Eye class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Table Selected</h3>
      <p class="text-gray-600">Choose a table from the navigation to view its data.</p>
    </div>

    <div v-else-if="!tableDetails">
      <div class="text-center py-12 text-gray-600">Loading table details...</div>
    </div>

    <div v-else>
      <div class="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <!-- Actions Header -->
        <div class="p-2 border-b bg-gray-50 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm">With selected:</span>
            <button 
              @click="handleBulkDelete"
              :disabled="selectedRows.length === 0"
              class="px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Trash2 class="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr class="border-b border-gray-300">
                <th class="p-2 w-10 text-center">
                  <input type="checkbox" @change="toggleSelectAll" :checked="allSelected" class="form-checkbox" />
                </th>
                <th 
                  v-for="column in tableDetails.schema" 
                  :key="column.name" 
                  @click="sortBy(column.name)"
                  class="text-left py-2 px-3 font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-200"
                >
                  <div class="flex items-center gap-1">
                    {{ column.name }}
                    <template v-if="sort.column === column.name">
                      <ArrowUp v-if="sort.direction === 'asc'" class="w-3 h-3" />
                      <ArrowDown v-else class="w-3 h-3" />
                    </template>
                  </div>
                </th>
                <th class="text-left py-2 px-3 font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedData.length === 0">
                <td :colspan="tableDetails.schema.length + 2" class="text-center p-4 text-gray-500">
                  Table is empty or no results for this page.
                </td>
              </tr>
              <tr 
                v-for="(row, index) in paginatedData" 
                :key="getRowId(row)"
                :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'"
                class="border-b border-gray-200 last:border-b-0 hover:bg-blue-50"
              >
                <td class="p-2 text-center">
                  <input type="checkbox" :value="getRowId(row)" v-model="selectedRows" class="form-checkbox" />
                </td>
                <td v-for="col in tableDetails.schema" :key="col.name" class="py-2 px-3 whitespace-nowrap">
                  <span v-if="row[col.name] === null" class="text-gray-400 italic">NULL</span>
                  <span v-else>{{ row[col.name] }}</span>
                </td>
                <td class="py-2 px-3 whitespace-nowrap">
                  <button @click="openEditModal(row)" class="text-blue-600 hover:text-blue-800 mr-2"><Pencil class="w-4 h-4" /></button>
                  <button @click="handleDeleteRow(row)" class="text-red-600 hover:text-red-800"><Trash2 class="w-4 h-4" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination Footer -->
        <div class="p-2 border-t bg-gray-50 flex items-center justify-between">
          <span class="text-xs text-gray-600">
            Showing {{ paginatedData.length }} of {{ totalRows }} rows
          </span>
          <div class="flex items-center gap-1">
            <button @click="currentPage--" :disabled="currentPage === 1" class="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span class="text-xs">Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal 
      v-if="showConfirmModal"
      :title="confirmModalContent.title"
      :message="confirmModalContent.message"
      @confirm="confirmAction"
      @cancel="showConfirmModal = false"
    />
    
    <EditRowModal
      v-if="showEditModal && editingRow && tableDetails"
      :row="editingRow"
      :schema="tableDetails.schema"
      @save="handleSaveRow"
      @cancel="showEditModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Eye, Trash2, Pencil, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { reactiveMockServer } from '../../services/apiService';
import type { TableDetails, Sort } from '../../types';
import ConfirmModal from '../modals/ConfirmModal.vue';
import EditRowModal from '../modals/EditRowModal.vue';

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

const primaryKey = computed(() => tableDetails.value?.schema.find(c => c.key === 'PRI')?.name || 'id');
const getRowId = (row: any) => row[primaryKey.value];

// State for interactivity
const currentPage = ref(1);
const rowsPerPage = 25;
const sort = ref<Sort>({ column: primaryKey.value, direction: 'asc' });
const selectedRows = ref<(string | number)[]>([]);

// Pagination computed properties
const totalRows = computed(() => tableDetails.value?.data.length || 0);
const totalPages = computed(() => Math.ceil(totalRows.value / rowsPerPage) || 1);

const sortedData = computed(() => {
  if (!tableDetails.value) return [];
  const data = [...tableDetails.value.data];
  return data.sort((a, b) => {
    const valA = a[sort.value.column];
    const valB = b[sort.value.column];
    if (valA < valB) return sort.value.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sort.value.direction === 'asc' ? 1 : -1;
    return 0;
  });
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  return sortedData.value.slice(start, end);
});

// Bulk selection
const allSelected = computed(() => {
  if (paginatedData.value.length === 0) return false;
  return paginatedData.value.every(row => selectedRows.value.includes(getRowId(row)));
});

const toggleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.checked) {
    selectedRows.value = [...new Set([...selectedRows.value, ...paginatedData.value.map(getRowId)])];
  } else {
    const pageIds = paginatedData.value.map(getRowId);
    selectedRows.value = selectedRows.value.filter(id => !pageIds.includes(id));
  }
};

// Sorting
const sortBy = (column: string) => {
  if (sort.value.column === column) {
    sort.value.direction = sort.value.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sort.value.column = column;
    sort.value.direction = 'asc';
  }
};

// Reset state when table changes
watch(() => props.table, () => {
  currentPage.value = 1;
  sort.value = { column: primaryKey.value, direction: 'asc' };
  selectedRows.value = [];
});

// Modal state
const showConfirmModal = ref(false);
const confirmModalContent = ref({ title: '', message: '' });
const actionToConfirm = ref<(() => void) | null>(null);

const showEditModal = ref(false);
const editingRow = ref<any | null>(null);

// Actions
const handleDeleteRow = (row: any) => {
  confirmModalContent.value = {
    title: 'Delete Row',
    message: `Are you sure you want to delete the row with ${primaryKey.value} = ${getRowId(row)}? This action cannot be undone.`
  };
  actionToConfirm.value = () => {
    const query = `DELETE FROM \`${props.table}\` WHERE \`${primaryKey.value}\` IN (${getRowId(row)});`;
    emit('executeQuery', query);
  };
  showConfirmModal.value = true;
};

const handleBulkDelete = () => {
  if (selectedRows.value.length === 0) return;
  confirmModalContent.value = {
    title: `Delete ${selectedRows.value.length} Rows`,
    message: `Are you sure you want to delete ${selectedRows.value.length} selected rows? This action cannot be undone.`
  };
  actionToConfirm.value = () => {
    const ids = selectedRows.value.join(',');
    const query = `DELETE FROM \`${props.table}\` WHERE \`${primaryKey.value}\` IN (${ids});`;
    emit('executeQuery', query);
    selectedRows.value = [];
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

const openEditModal = (row: any) => {
  editingRow.value = { ...row };
  showEditModal.value = true;
};

const handleSaveRow = (updatedRow: any) => {
  const pkValue = getRowId(updatedRow);
  const setClauses = Object.keys(updatedRow)
    .filter(key => key !== primaryKey.value)
    .map(key => `\`${key}\` = '${updatedRow[key]}'`)
    .join(', ');
  
  const query = `UPDATE \`${props.table}\` SET ${setClauses} WHERE \`${primaryKey.value}\` = '${pkValue}';`;
  emit('executeQuery', query);
  showEditModal.value = false;
};
</script>

<style scoped>
.form-checkbox {
  @apply h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500;
}
</style>
