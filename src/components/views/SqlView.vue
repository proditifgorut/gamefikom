<template>
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
    <!-- Left Panel: Query Helpers -->
    <div class="lg:col-span-1 bg-white border border-gray-200 rounded-lg p-4 h-fit">
      <h3 class="text-base font-semibold text-gray-800 mb-3">Query Helpers</h3>
      <div class="space-y-2">
        <button v-for="helper in queryHelpers" :key="helper.type" @click="generateQuery(helper.type)"
          class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-colors">
          <component :is="helper.icon" class="w-4 h-4" />
          <span>{{ helper.label }}</span>
        </button>
      </div>
    </div>

    <!-- Right Panel: Editor and Results -->
    <div class="lg:col-span-3 space-y-4">
      <div class="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div class="bg-gray-50 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">SQL Query Editor</h3>
          <button @click="runQuery" :disabled="executing"
            class="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
            <Play v-if="!executing" class="w-3 h-3" />
            <Loader2 v-else class="w-3 h-3 animate-spin" />
            {{ executing ? 'Executing...' : 'Run' }}
          </button>
        </div>
        <div ref="editorContainer" class="w-full h-72"></div>
      </div>

      <div v-if="queryResult || executing" class="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div class="bg-gray-50 px-4 py-2 border-b border-gray-300">
          <h3 class="text-sm font-semibold text-gray-700">Results</h3>
        </div>
        <div class="p-4">
          <div v-if="executing" class="text-center py-8 text-gray-600">Executing...</div>
          <div v-else-if="queryResult?.error" class="text-red-600 p-2 bg-red-50 rounded-md">{{ queryResult.error }}</div>
          <div v-else-if="queryResult?.success">
            <div v-if="queryResult.message" class="text-green-700 mb-2 p-2 bg-green-50 rounded-md">{{ queryResult.message }}</div>
            <div v-if="queryResult.data" class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th v-for="col in queryResult.columns" :key="col" class="text-left p-2 font-medium">{{ col }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in queryResult.data" :key="i" class="border-b last:border-b-0 hover:bg-gray-50">
                    <td v-for="col in queryResult.columns" :key="col" class="p-2 whitespace-nowrap">
                      <span v-if="row[col] === null" class="text-gray-400 italic">NULL</span>
                      <span v-else>{{ row[col] }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Play, Loader2, FileSearch, FilePlus, FilePen, FileX, Table } from 'lucide-vue-next';
import * as monaco from 'monaco-editor';
import { useLocalStorage } from '../../composables/useLocalStorage';
import type { QueryResult } from '../../types';

type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE_TABLE';

const props = defineProps<{
  database: string;
  table: string;
  executing: boolean;
  queryResult: QueryResult | null;
}>();

const emit = defineEmits<{
  (e: 'executeQuery', query: string): void;
}>();

const editorContainer = ref<HTMLElement>();
const [query, setQuery] = useLocalStorage('sqlQuery', `SELECT * FROM ${props.table || 'users'} LIMIT 10;`);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const queryHelpers = [
  { type: 'SELECT', label: 'SELECT', icon: FileSearch },
  { type: 'INSERT', label: 'INSERT', icon: FilePlus },
  { type: 'UPDATE', label: 'UPDATE', icon: FilePen },
  { type: 'DELETE', label: 'DELETE', icon: FileX },
  { type: 'CREATE_TABLE', label: 'CREATE TABLE', icon: Table },
] as const;

const generateQuery = (type: QueryType) => {
  const tableName = props.table ? `\`${props.table}\`` : '`your_table`';
  let newQuery = '';

  switch (type) {
    case 'SELECT':
      newQuery = `SELECT * FROM ${tableName} WHERE 1;`;
      break;
    case 'INSERT':
      newQuery = `INSERT INTO ${tableName} (\`column1\`, \`column2\`) VALUES ('value1', 'value2');`;
      break;
    case 'UPDATE':
      newQuery = `UPDATE ${tableName} SET \`column1\` = 'new_value' WHERE \`condition\`;`;
      break;
    case 'DELETE':
      newQuery = `DELETE FROM ${tableName} WHERE \`condition\`;`;
      break;
    case 'CREATE_TABLE':
      newQuery = `CREATE TABLE \`new_table\` (\n  \`id\` INT NOT NULL AUTO_INCREMENT,\n  \`name\` VARCHAR(255) NOT NULL,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (\`id\`)\n);`;
      break;
  }

  if (editor) {
    editor.setValue(newQuery);
    editor.focus();
  } else {
    setQuery(newQuery);
  }
};

watch(() => props.table, (newTable) => {
  const newDefaultQuery = `SELECT * FROM ${newTable || 'users'} LIMIT 10;`;
  // Only update if the editor is empty or has the old default query
  if (!query.value || query.value.startsWith('SELECT * FROM')) {
      setQuery(newDefaultQuery);
      if (editor) {
        editor.setValue(newDefaultQuery);
      }
  }
});

onMounted(() => {
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: query.value,
      language: 'sql',
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: 'on',
      fontSize: 14,
    });
    editor.onDidChangeModelContent(() => {
      setQuery(editor?.getValue() || '');
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runQuery);
  }
});

onUnmounted(() => {
  editor?.dispose();
});

const runQuery = () => {
  if (props.executing) return;
  const currentQuery = editor?.getValue() || '';
  if (currentQuery.trim()) {
    emit('executeQuery', currentQuery.trim());
  }
};
</script>
