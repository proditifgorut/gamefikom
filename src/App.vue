<template>
  <div class="min-h-screen bg-gray-50 text-gray-800 font-sans">
    <header class="bg-blue-600 text-white shadow-md sticky top-0 z-20">
      <div class="flex items-center justify-between h-14 px-4">
        <div class="flex items-center gap-3">
          <Server class="w-6 h-6" />
          <h1 class="text-lg font-semibold">ProdiTIF | MySQL Editor</h1>
        </div>
        <div class="flex items-center gap-4 text-sm">
          <div v-if="isDemoMode" class="flex items-center gap-1.5 bg-blue-500 px-2 py-1 rounded-full text-xs font-medium">
            <TestTube class="w-3.5 h-3.5" />
            <span>Demo Mode</span>
          </div>
          <span class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full" :class="connectionPillClass"></div>
            {{ connectionStatus?.connected ? 'Connected' : 'Offline' }}
          </span>
        </div>
      </div>
    </header>

    <div class="flex" style="height: calc(100vh - 56px);">
      <aside class="w-72 bg-gray-100 border-r border-gray-300 overflow-y-auto flex flex-col">
        <div class="p-3 border-b border-gray-300">
          <ConnectionForm @connection-changed="handleConnectionChanged" :compact="true" />
        </div>
        <DatabaseNavigation
          v-if="connectionStatus?.connected"
          :databases="allDatabases"
          :current-database="currentDatabase"
          :current-table="currentTable"
          @database-selected="handleDatabaseSelected"
          @table-selected="handleTableSelected"
          @execute-query="executeQuery"
          class="flex-1"
        />
      </aside>

      <main class="flex-1 flex flex-col overflow-hidden bg-white">
        <div v-if="connectionStatus?.connected" class="border-b border-gray-200 px-4 py-2 bg-gray-50/50">
          <div class="text-sm text-gray-600 flex items-center gap-1.5">
            <Server class="w-4 h-4 text-gray-500"/>
            <span class="font-medium text-gray-500">localhost</span>
            <template v-if="currentDatabase">
              <ChevronRight class="w-4 h-4 text-gray-400" />
              <Database class="w-4 h-4 text-gray-500" />
              <span class="font-semibold text-blue-600">{{ currentDatabase }}</span>
            </template>
            <template v-if="currentTable">
              <ChevronRight class="w-4 h-4 text-gray-400" />
              <Table class="w-4 h-4 text-gray-500" />
              <span class="font-semibold text-blue-600">{{ currentTable }}</span>
            </template>
          </div>
        </div>
        
        <nav v-if="connectionStatus?.connected" class="bg-gray-50 border-b border-gray-300 flex-shrink-0">
          <div class="flex">
            <button
              v-for="tab in activeTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-4 py-2 text-sm font-medium border-r border-gray-300 hover:bg-gray-200 transition-colors flex items-center gap-1.5',
                activeTab === tab.id ? 'bg-white border-b-2 border-blue-500 text-blue-600' : 'text-gray-700'
              ]"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </button>
          </div>
        </nav>

        <div class="flex-1 overflow-auto">
          <div v-if="!connectionStatus?.connected" class="flex items-center justify-center h-full text-center">
            <div>
              <Database class="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 class="text-xl font-semibold text-gray-700 mb-2">Welcome to MySQL Editor</h2>
              <p class="text-gray-500">Use the form on the left to connect to a database server.</p>
            </div>
          </div>
          
          <div v-else class="p-4">
             <component 
                :is="activeView"
                :database="currentDatabase"
                :table="currentTable"
                :connection="currentConnection"
                :executing="executing"
                :query-result="queryResult"
                @execute-query="executeQuery"
                @execute-script="executeScript"
                @query-executed="handleQueryExecuted"
                @change-tab="handleTabChange"
                @navigate="handleNavigation"
             />
          </div>
        </div>
      </main>
    </div>
    
    <!-- Toast Notifications -->
    <div class="fixed bottom-5 right-5 z-50 space-y-3">
      <ToastNotification
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @close="removeToast(toast.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Database, TestTube, Table, Eye, FileText, Upload, Download, Settings, Server, ChevronRight, BarChart, PlusSquare, Share2 } from 'lucide-vue-next';
import ConnectionForm from './components/ConnectionForm.vue';
import DatabaseNavigation from './components/DatabaseNavigation.vue';
import ServerView from './components/views/ServerView.vue';
import DatabaseView from './components/views/DatabaseView.vue';
import CreateTableView from './components/views/CreateTableView.vue';
import TableStructureView from './components/views/TableStructureView.vue';
import TableBrowseView from './components/views/TableBrowseView.vue';
import TableInsertView from './components/views/TableInsertView.vue';
import SqlView from './components/views/SqlView.vue';
import ImportView from './components/views/ImportView.vue';
import ExportView from './components/views/ExportView.vue';
import TableOperationsView from './components/views/TableOperationsView.vue';
import DesignerView from './components/views/DesignerView.vue';
import ToastNotification from './components/ToastNotification.vue';
import type { DatabaseConnection, ConnectionStatus, QueryResult } from './types';
import { apiService, reactiveMockServer } from './services/apiService';
import { useToasts } from './composables/useToasts';

const { toasts, addToast, removeToast } = useToasts();

const connectionStatus = ref<ConnectionStatus | null>(null);
const currentConnection = ref<DatabaseConnection | null>(null);
const allDatabases = computed(() => reactiveMockServer.value ? Object.keys(reactiveMockServer.value) : []);
const currentDatabase = ref<string>('');
const currentTable = ref<string>('');
const executing = ref(false);
const queryResult = ref<QueryResult | null>(null);
const activeTab = ref('databases');

const isDemoMode = computed(() => apiService.isDemoMode());

const connectionPillClass = computed(() => ({
  'bg-green-400 animate-pulse': connectionStatus.value?.connected,
  'bg-red-400': connectionStatus.value && !connectionStatus.value.connected,
  'bg-gray-400': !connectionStatus.value
}));

const serverTabs = [
  { id: 'databases', label: 'Databases', icon: Database },
  { id: 'sql', label: 'SQL', icon: FileText },
  { id: 'status', label: 'Status', icon: BarChart },
  { id: 'import', label: 'Import', icon: Upload },
];
const databaseTabs = [
  { id: 'structure', label: 'Structure', icon: Table },
  { id: 'sql', label: 'SQL', icon: FileText },
  { id: 'new', label: 'New', icon: PlusSquare },
  { id: 'designer', label: 'Designer', icon: Share2 },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'operations', label: 'Operations', icon: Settings },
];
const tableTabs = [
  { id: 'browse', label: 'Browse', icon: Eye },
  { id: 'structure', label: 'Structure', icon: Table },
  { id: 'sql', label: 'SQL', icon: FileText },
  { id: 'insert', label: 'Insert', icon: PlusSquare },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'operations', label: 'Operations', icon: Settings },
];

const activeTabs = computed(() => {
  if (currentTable.value) return tableTabs;
  if (currentDatabase.value) return databaseTabs;
  return serverTabs;
});

const viewMap: Record<string, any> = {
  // Server
  'databases': ServerView,
  // Database
  'structure': DatabaseView,
  'new': CreateTableView,
  'designer': DesignerView,
  // Table
  'browse': TableBrowseView,
  'table_structure': TableStructureView,
  'insert': TableInsertView,
  'operations': TableOperationsView,
  // Shared
  'import': ImportView,
  'export': ExportView,
  'sql': SqlView,
  'status': ServerView, // Placeholder
};

const activeView = computed(() => {
    if (!currentDatabase.value) return viewMap[activeTab.value] || ServerView;
    if (!currentTable.value) {
      if (activeTab.value === 'new') return CreateTableView;
      return viewMap[activeTab.value] || DatabaseView;
    }
    
    if(activeTab.value === 'structure') return TableStructureView;
    
    return viewMap[activeTab.value] || TableBrowseView;
});

const handleConnectionChanged = (connection: DatabaseConnection, status: ConnectionStatus) => {
  connectionStatus.value = status;
  if (status.connected) {
    currentConnection.value = connection;
    currentDatabase.value = '';
    currentTable.value = '';
    activeTab.value = 'databases';
    addToast({ type: 'success', message: status.message || 'Connected successfully!' });
  } else {
    currentConnection.value = null;
    currentDatabase.value = '';
    currentTable.value = '';
    addToast({ type: 'error', message: status.error || 'Connection failed.' });
  }
};

const handleDatabaseSelected = (database: string) => {
  currentDatabase.value = database;
  currentTable.value = '';
  activeTab.value = 'structure';
  if (currentConnection.value) {
    currentConnection.value.database = database;
  }
};

const handleTableSelected = (table: string) => {
  currentTable.value = table;
  activeTab.value = 'browse';
};

const executeQuery = async (query: string, options: { silent?: boolean } = {}) => {
  if (!currentConnection.value) return;
  executing.value = true;
  queryResult.value = null;
  try {
    const result = await apiService.executeQuery(query, currentConnection.value);
    queryResult.value = result;

    if (!options.silent) {
      if (result.success) {
        addToast({ type: 'success', message: result.message || 'Query executed successfully!' });
      } else {
        addToast({ type: 'error', message: result.error || 'Query failed.' });
      }
    }

    // After a successful CREATE TABLE query, navigate to the new table
    if (result.success && query.trim().toLowerCase().startsWith('create table')) {
      const tableNameMatch = /create table\s+`?(\w+)`?/.exec(query.trim().toLowerCase());
      if (tableNameMatch && tableNameMatch[1]) {
        handleTableSelected(tableNameMatch[1]);
        activeTab.value = 'structure';
      }
    }
    
    // After dropping a table, go back to DB view
    if (result.success && query.trim().toLowerCase().startsWith('drop table')) {
      handleNavigation({ db: currentDatabase.value });
    }

  } catch (error) {
    console.error('Query execution error:', error);
    const errMessage = 'Network error occurred';
    queryResult.value = { success: false, error: errMessage };
    if (!options.silent) {
      addToast({ type: 'error', message: errMessage });
    }
  } finally {
    executing.value = false;
  }
};

const executeScript = async (script: string) => {
  if (!currentConnection.value) return;
  executing.value = true;
  try {
    const results = await apiService.executeScript(script, currentConnection.value);
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;
    addToast({ type: 'info', message: `Import finished. ${successCount} successful, ${errorCount} failed.` });
    // You might want to display detailed results in a dedicated component
    console.log('Import results:', results);
  } catch (error) {
    addToast({ type: 'error', message: 'Script execution failed.' });
  } finally {
    executing.value = false;
  }
};

const handleQueryExecuted = (result: QueryResult) => {
  queryResult.value = result;
};

const handleTabChange = (tabId: string) => {
  activeTab.value = tabId;
};

const handleNavigation = (location: { db?: string, table?: string }) => {
  if (location.db && !location.table) {
    handleDatabaseSelected(location.db);
  }
  if (location.db && location.table) {
    currentDatabase.value = location.db;
    handleTableSelected(location.table);
  }
}
</script>

<style>
body {
  font-family: 'Inter', sans-serif;
}
/* For Webkit browsers */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
