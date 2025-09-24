<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <h2 class="text-xl font-semibold text-gray-800">Export</h2>

    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Export Options -->
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-3">Options</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Export Target</label>
              <div class="mt-1 flex rounded-md shadow-sm">
                <button 
                  @click="exportTarget = 'table'" 
                  :disabled="!table"
                  :class="['relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium', exportTarget === 'table' ? 'bg-blue-500 border-blue-500 text-white z-10' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50', !table ? 'opacity-50 cursor-not-allowed' : '']"
                >
                  Current Table
                </button>
                <button 
                  @click="exportTarget = 'database'"
                  :class="['relative -ml-px inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium', exportTarget === 'database' ? 'bg-blue-500 border-blue-500 text-white z-10' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50']"
                >
                  Database
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Format</label>
              <select v-model="exportFormat" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option value="sql">SQL</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
          <button @click="generateExport" class="mt-6 w-full px-6 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2">
            <Download class="w-4 h-4" />
            Generate Export
          </button>
        </div>
        
        <!-- Export Output -->
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-3">Output</h3>
          <div class="relative">
            <textarea 
              v-model="exportContent"
              readonly
              rows="10"
              class="w-full p-2 border-gray-300 rounded-md shadow-sm font-mono text-xs bg-gray-50"
              placeholder="Generated export content will appear here..."
            ></textarea>
            <div class="absolute top-2 right-2 flex gap-2">
              <button @click="copyToClipboard" v-if="exportContent" class="p-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                <Clipboard class="w-4 h-4" />
              </button>
              <button @click="downloadFile" v-if="exportContent" class="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Download class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Download, Clipboard } from 'lucide-vue-next';
import { reactiveMockServer } from '../../services/apiService';
import type { TableDetails } from '../../types';
import { useToasts } from '../../composables/useToasts';

const props = defineProps<{
  database: string;
  table: string;
}>();

const { addToast } = useToasts();

const exportTarget = ref<'table' | 'database'>(props.table ? 'table' : 'database');
const exportFormat = ref<'sql' | 'csv' | 'json'>('sql');
const exportContent = ref('');

const dbDetails = computed(() => reactiveMockServer.value[props.database]);

const generateExport = () => {
  if (!dbDetails.value) return;

  if (exportTarget.value === 'table' && !props.table) {
    addToast({ type: 'error', message: 'No table selected for export.' });
    return;
  }

  const target = exportTarget.value === 'table' ? { [props.table]: dbDetails.value[props.table] } : dbDetails.value;
  
  switch (exportFormat.value) {
    case 'sql':
      exportContent.value = generateSql(target);
      break;
    case 'csv':
      if (exportTarget.value === 'database') {
        addToast({ type: 'error', message: 'CSV export is only available for single tables.' });
        return;
      }
      exportContent.value = generateCsv(target[props.table]);
      break;
    case 'json':
      if (exportTarget.value === 'database') {
        addToast({ type: 'error', message: 'JSON export is only available for single tables.' });
        return;
      }
      exportContent.value = generateJson(target[props.table]);
      break;
  }
};

const generateSql = (target: Record<string, TableDetails>): string => {
  let sql = `-- MySQL Editor Online Export\n`;
  sql += `-- Version: 1.0\n`;
  sql += `-- Host: localhost\n`;
  sql += `-- Generation Time: ${new Date().toISOString()}\n\n`;
  sql += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
  sql += `SET time_zone = "+00:00";\n\n`;
  sql += `/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;\n`;
  sql += `/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;\n`;
  sql += `/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;\n`;
  sql += `/*!40101 SET NAMES utf8mb4 */;\n\n`;

  sql += `--\n-- Database: \`${props.database}\`\n--\n`;
  if (exportTarget.value === 'database') {
      sql += `CREATE DATABASE IF NOT EXISTS \`${props.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
  }
  sql += `USE \`${props.database}\`;\n`;

  const tablesToExport = Object.values(target);

  // 1. Table Structures
  for (const table of tablesToExport) {
    sql += `\n-- --------------------------------------------------------\n\n`;
    sql += `--\n-- Table structure for table \`${table.name}\`\n--\n\n`;
    sql += `DROP TABLE IF EXISTS \`${table.name}\`;\n`;
    
    const columnDefs = table.schema.map(col => {
      let def = `  \`${col.name}\` ${col.type}`;
      if (!col.null) def += ' NOT NULL';
      if (col.extra.includes('AUTO_INCREMENT')) def += ' AUTO_INCREMENT';
      if (col.default !== null && col.default !== 'NULL') {
          if (col.default.includes('(') && col.default.includes(')')) {
              def += ` DEFAULT ${col.default}`;
          } else {
              def += ` DEFAULT '${col.default}'`;
          }
      }
      return def;
    });

    sql += `CREATE TABLE \`${table.name}\` (\n${columnDefs.join(',\n')}\n) ENGINE=${table.engine} DEFAULT CHARSET=${table.collation.split('_')[0]} COLLATE=${table.collation};\n`;
  }

  // 2. Table Data
  for (const table of tablesToExport) {
    if (table.data.length > 0) {
      sql += `\n--\n-- Dumping data for table \`${table.name}\`\n--\n\n`;
      const columnNames = table.schema.map(c => `\`${c.name}\``).join(', ');
      
      const chunkSize = 100;
      for (let i = 0; i < table.data.length; i += chunkSize) {
          const chunk = table.data.slice(i, i + chunkSize);
          const insertValues = chunk.map(row => {
            const values = table.schema.map(col => {
              const val = row[col.name];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number') return val;
              return `'${String(val).replace(/'/g, "''")}'`;
            });
            return `(${values.join(', ')})`;
          }).join(',\n');
          sql += `INSERT INTO \`${table.name}\` (${columnNames}) VALUES\n${insertValues};\n`;
      }
      sql += `\n`;
    }
  }

  // 3. Indexes and Keys
  sql += `\n--\n-- Indexes for dumped tables\n--\n`;
  for (const table of tablesToExport) {
    const keys = {
      PRIMARY: [] as string[],
      UNIQUE: {} as Record<string, string[]>,
      MUL: {} as Record<string, string[]>
    };
    
    table.schema.forEach(col => {
      if (col.key === 'PRI') keys.PRIMARY.push(`\`${col.name}\``);
      if (col.key === 'UNI') {
          const keyName = `\`${col.name}\``;
          if (!keys.UNIQUE[keyName]) keys.UNIQUE[keyName] = [];
          keys.UNIQUE[keyName].push(`\`${col.name}\``);
      }
      if (col.key === 'MUL') {
          const keyName = `\`${col.name}\``;
          if (!keys.MUL[keyName]) keys.MUL[keyName] = [];
          keys.MUL[keyName].push(`\`${col.name}\``);
      }
    });

    let alterStatements: string[] = [];
    if (keys.PRIMARY.length > 0) {
      alterStatements.push(`ADD PRIMARY KEY (${keys.PRIMARY.join(', ')})`);
    }
    Object.entries(keys.UNIQUE).forEach(([keyName, cols]) => {
      alterStatements.push(`ADD UNIQUE KEY ${keyName} (${cols.join(', ')})`);
    });
    Object.entries(keys.MUL).forEach(([keyName, cols]) => {
      alterStatements.push(`ADD KEY ${keyName} (${cols.join(', ')})`);
    });

    if (alterStatements.length > 0) {
      sql += `\nALTER TABLE \`${table.name}\`\n  ${alterStatements.join(',\n  ')};\n`;
    }
  }

  // 4. Auto Increment values
  sql += `\n--\n-- AUTO_INCREMENT for dumped tables\n--\n`;
  for (const table of tablesToExport) {
    const autoIncrementCol = table.schema.find(c => c.extra.includes('AUTO_INCREMENT'));
    if (autoIncrementCol) {
      const maxId = table.data.reduce((max, row) => Math.max(max, Number(row[autoIncrementCol.name]) || 0), 0);
      sql += `\nALTER TABLE \`${table.name}\`\n  MODIFY \`${autoIncrementCol.name}\` ${autoIncrementCol.type} NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=${maxId + 1};\n`;
    }
  }

  // 5. Foreign Key Constraints
  sql += `\n--\n-- Constraints for dumped tables\n--\n`;
  let hasConstraints = false;
  let constraintsSql = '';
  for (const table of tablesToExport) {
      table.schema.forEach((col, i) => {
          if (col.references) {
              hasConstraints = true;
              constraintsSql += `\nALTER TABLE \`${table.name}\`\n`;
              constraintsSql += `  ADD CONSTRAINT \`${table.name}_ibfk_${i+1}\` FOREIGN KEY (\`${col.name}\`) REFERENCES \`${col.references.table}\` (\`${col.references.column}\`);\n`;
          }
      });
  }

  if (hasConstraints) {
    sql += `SET FOREIGN_KEY_CHECKS=0;\n`
    sql += constraintsSql;
    sql += `SET FOREIGN_KEY_CHECKS=1;\n`;
  }

  sql += `\n/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;\n`;
  sql += `/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;\n`;
  sql += `/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;\n`;

  return sql;
};

const generateCsv = (table: TableDetails): string => {
  const headers = table.schema.map(c => c.name).join(',');
  const rows = table.data.map(row => {
    return table.schema.map(col => {
      let val = row[col.name] === null ? '' : String(row[col.name]);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',');
  });
  return `${headers}\n${rows.join('\n')}`;
};

const generateJson = (table: TableDetails): string => {
  return JSON.stringify(table.data, null, 2);
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(exportContent.value);
    addToast({ type: 'success', message: 'Copied to clipboard!' });
  } catch (err) {
    addToast({ type: 'error', message: 'Failed to copy.' });
  }
};

const downloadFile = () => {
  const filename = `${props.database}${exportTarget.value === 'table' ? `_${props.table}` : ''}.${exportFormat.value}`;
  const mimeType = {
    sql: 'application/sql',
    csv: 'text/csv',
    json: 'application/json'
  }[exportFormat.value];

  const blob = new Blob([exportContent.value], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
</script>
