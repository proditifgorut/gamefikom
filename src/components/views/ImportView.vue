<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <h2 class="text-xl font-semibold text-gray-800">Import</h2>
    
    <!-- File Upload -->
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-3">Import from file</h3>
      <p class="text-sm text-gray-500 mb-4">Choose a `.sql` file to import.</p>
      <input 
        type="file" 
        @change="handleFileSelect"
        accept=".sql"
        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
    </div>

    <!-- Text Area -->
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-3">Or paste SQL here</h3>
      <textarea 
        v-model="sqlScript"
        rows="10"
        class="w-full p-2 border-gray-300 rounded-md shadow-sm font-mono text-sm"
        placeholder="-- Paste your SQL script here..."
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="flex justify-end">
      <button 
        @click="handleImport"
        :disabled="!sqlScript.trim() || executing"
        class="px-6 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        <Loader2 v-if="executing" class="w-4 h-4 animate-spin" />
        <Upload v-else class="w-4 h-4" />
        {{ executing ? 'Importing...' : 'Import' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Upload, Loader2 } from 'lucide-vue-next';

const props = defineProps<{
  executing: boolean;
}>();

const emit = defineEmits<{
  (e: 'executeScript', script: string): void;
}>();

const sqlScript = ref('');

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      sqlScript.value = e.target?.result as string;
    };
    reader.readAsText(file);
  }
};

const handleImport = () => {
  if (props.executing || !sqlScript.value.trim()) return;
  emit('executeScript', sqlScript.value);
};
</script>
