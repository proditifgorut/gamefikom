<template>
  <div class="p-3">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Databases</h3>
      <button @click="toggleCreateDbModal(true)" class="text-blue-600 hover:text-blue-800">
        <PlusCircle class="w-5 h-5" />
      </button>
    </div>
    
    <div class="space-y-1">
      <div v-for="db in databases" :key="db">
        <div 
          @click="toggleDatabase(db)"
          :class="[
            'flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors',
            currentDatabase === db ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-200'
          ]"
        >
          <div class="flex items-center gap-2">
            <Database class="w-4 h-4 flex-shrink-0" />
            <span class="text-sm font-medium truncate">{{ db }}</span>
          </div>
          <ChevronRight 
            class="w-4 h-4 transition-transform"
            :class="{ 'rotate-90': expanded[db] }"
          />
        </div>
        
        <div v-if="expanded[db]" class="pl-4 mt-1 space-y-1 border-l-2 border-gray-300 ml-4">
          <div v-if="dbDetails[db]">
            <!-- Tables -->
            <div v-if="Object.keys(dbDetails[db]).length > 0">
              <h4 class="text-xs font-semibold text-gray-500 my-1 pl-2">Tables</h4>
              <div 
                v-for="table in Object.values(dbDetails[db])" 
                :key="table.name"
                @click="$emit('tableSelected', table.name)"
                :class="[
                  'flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm',
                  currentTable === table.name && currentDatabase === db ? 'bg-blue-200' : 'hover:bg-gray-200'
                ]"
              >
                <Table class="w-3.5 h-3.5 text-gray-600" />
                <span class="truncate">{{ table.name }}</span>
              </div>
            </div>
            <div v-else class="text-xs text-gray-500 p-2">No tables found.</div>
          </div>
          <div v-else class="text-xs text-gray-500 p-2">Loading...</div>
        </div>
      </div>
    </div>
    
    <!-- Create DB Modal -->
    <div v-if="showCreateDbModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
        <div class="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 class="text-lg font-semibold mb-4">Create New Database</h3>
            <input v-model="newDbName" type="text" placeholder="database_name" class="w-full border-gray-300 rounded-md shadow-sm" />
            <div class="flex justify-end gap-3 mt-4">
                <button @click="toggleCreateDbModal(false)" class="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button @click="createDatabase" class="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Create</button>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Database, Table, ChevronRight, PlusCircle } from 'lucide-vue-next';
import { reactiveMockServer } from '../services/apiService';

const props = defineProps<{
  databases: string[];
  currentDatabase: string;
  currentTable: string;
}>();

const emit = defineEmits<{
  databaseSelected: [database: string];
  tableSelected: [table: string];
  executeQuery: [query: string];
}>();

const expanded = ref<Record<string, boolean>>({});
const dbDetails = computed(() => reactiveMockServer.value);
const showCreateDbModal = ref(false);
const newDbName = ref('');

watch(() => props.currentDatabase, (newDb) => {
  if (newDb && !expanded.value[newDb]) {
    toggleDatabase(newDb, true);
  }
});

const toggleDatabase = (db: string, forceExpand = false) => {
  emit('databaseSelected', db);
  
  const isCurrentlyExpanded = expanded.value[db];
  expanded.value[db] = forceExpand ? true : !isCurrentlyExpanded;
};

const toggleCreateDbModal = (show: boolean) => {
    showCreateDbModal.value = show;
    if (!show) newDbName.value = '';
}

const createDatabase = async () => {
    if (!newDbName.value.trim()) return;
    const query = `CREATE DATABASE \`${newDbName.value.trim()}\`;`;
    emit('executeQuery', query);
    toggleCreateDbModal(false);
}
</script>
