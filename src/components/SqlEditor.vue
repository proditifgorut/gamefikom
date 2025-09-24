<template>
  <div class="bg-white rounded-2xl shadow-md overflow-hidden">
    <!-- Header -->
    <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FileText class="w-5 h-5" />
          SQL Query Editor
        </h2>
        <div class="flex items-center gap-2">
          <button
            @click="clearEditor"
            class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 class="w-4 h-4" />
            Clear
          </button>
          <button
            @click="runQuery"
            :disabled="!canExecute || executing"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <Loader2 v-if="executing" class="w-4 h-4 animate-spin" />
            <Play v-else class="w-4 h-4" />
            {{ executing ? 'Running...' : 'Run Query' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Editor -->
    <div class="p-3">
      <div 
        ref="editorContainer" 
        class="w-full h-80 border border-gray-200 rounded-lg overflow-hidden"
      ></div>
    </div>
    
    <!-- Query Info -->
    <div v-if="query && query.trim()" class="px-6 py-3 bg-gray-50 border-t border-gray-200">
      <div class="flex items-center justify-between text-sm text-gray-600">
        <span>Query length: {{ query.length }} characters</span>
        <div class="flex items-center gap-4">
          <span>Auto-saved to localStorage</span>
          <span class="text-blue-600">Ctrl+Enter to run</span>
        </div>
      </div>
    </div>

    <!-- Connection Required Notice -->
    <div v-if="!canExecute" class="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
      <div class="flex items-center gap-2 text-yellow-800 text-sm">
        <AlertTriangle class="w-4 h-4" />
        <span>Connect to a database to execute queries</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { FileText, Play, Trash2, Loader2, AlertTriangle } from 'lucide-vue-next';
import * as monaco from 'monaco-editor';
import { useLocalStorage } from '../composables/useLocalStorage';

const props = defineProps<{
  canExecute: boolean;
  executing: boolean;
  sampleQuery?: string;
}>();

const emit = defineEmits<{
  queryChanged: [query: string];
  executeQuery: [query: string];
}>();

const editorContainer = ref<HTMLElement>();
const [query, setQuery] = useLocalStorage('sqlQuery', 'SELECT * FROM users LIMIT 10;');
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

onMounted(async () => {
  if (!editorContainer.value) return;

  try {
    // Configure Monaco Editor for SQL
    monaco.languages.register({ id: 'mysql' });
    
    // Set SQL language configuration
    monaco.languages.setLanguageConfiguration('mysql', {
      comments: {
        lineComment: '--',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
    });

    // Define SQL tokens with better syntax highlighting
    monaco.languages.setMonarchTokensProvider('mysql', {
      keywords: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
        'TABLE', 'DATABASE', 'INDEX', 'VIEW', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
        'ON', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'LIKE', 'IN', 'BETWEEN', 'ORDER', 'BY',
        'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
        'ASC', 'DESC', 'UNION', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'EXISTS',
        'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'AUTO_INCREMENT', 'DEFAULT',
        'VARCHAR', 'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'DECIMAL', 'FLOAT',
        'DOUBLE', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'TEXT', 'LONGTEXT', 'MEDIUMTEXT',
        'BLOB', 'LONGBLOB', 'MEDIUMBLOB', 'BOOLEAN', 'BOOL', 'CHAR'
      ],
      operators: ['=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=', '&&', '||', '++', '--', '+', '-', '*', '/', '%'],
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      tokenizer: {
        root: [
          [/[a-z_$][\w$]*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],
          [/[A-Z_$][\w$]*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'type.identifier'
            }
          }],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string_double'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/'/, 'string', '@string_single'],
          [/`([^`\\]|\\.)*$/, 'string.invalid'],
          [/`/, 'string', '@string_backtick'],
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/\d+/, 'number'],
          [/[;,.]/, 'delimiter'],
          [/@symbols/, {
            cases: {
              '@operators': 'operator',
              '@default': ''
            }
          }],
          [/\s+/, 'white'],
          [/--.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
        ],
        string_double: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],
        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop']
        ],
        string_backtick: [
          [/[^\\`]+/, 'string'],
          [/\\./, 'string.escape'],
          [/`/, 'string', '@pop']
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],
      },
    });

    // Create editor with improved settings
    editor = monaco.editor.create(editorContainer.value, {
      value: query.value,
      language: 'mysql',
      theme: 'vs',
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, "Courier New", Monaco, monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: 'on',
      wrappingIndent: 'indent',
      selectOnLineNumbers: true,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
      },
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      contextmenu: true,
      mouseWheelZoom: true,
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
    });

    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      const value = editor?.getValue() || '';
      setQuery(value);
      emit('queryChanged', value);
    });

    // Add keyboard shortcut for running query (Ctrl+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (props.canExecute && !props.executing) {
        runQuery();
      }
    });

    // Handle focus and blur for better UX
    editor.onDidFocusEditorWidget(() => {
      console.log('Editor focused');
    });

  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error);
    // Fallback to textarea if Monaco fails
    createFallbackEditor();
  }
});

const createFallbackEditor = () => {
  if (!editorContainer.value) return;
  
  const textarea = document.createElement('textarea');
  textarea.value = query.value;
  textarea.className = 'w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none';
  textarea.placeholder = 'Enter your SQL query here...';
  
  textarea.addEventListener('input', (e) => {
    const value = (e.target as HTMLTextAreaElement).value;
    setQuery(value);
    emit('queryChanged', value);
  });
  
  // Add keyboard shortcut
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (props.canExecute && !props.executing) {
        runQuery();
      }
    }
  });
  
  editorContainer.value.innerHTML = '';
  editorContainer.value.appendChild(textarea);
};

onUnmounted(() => {
  if (editor) {
    editor.dispose();
  }
});

const runQuery = (): void => {
  const currentQuery = editor?.getValue() || query.value;
  if (currentQuery.trim()) {
    emit('executeQuery', currentQuery.trim());
  }
};

const clearEditor = (): void => {
  if (editor) {
    editor.setValue('');
  }
  setQuery('');
  emit('queryChanged', '');
};

// Watch for external query changes (e.g., from sample queries)
watch(() => props.sampleQuery, (newQuery) => {
  if (newQuery && newQuery !== query.value) {
    if (editor) {
      editor.setValue(newQuery);
    }
    setQuery(newQuery);
    emit('queryChanged', newQuery);
  }
});

// Watch for localStorage changes
watch(() => query.value, (newQuery) => {
  if (editor && editor.getValue() !== newQuery) {
    editor.setValue(newQuery);
  }
});
</script>
