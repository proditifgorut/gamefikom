<template>
  <div class="bg-white rounded-2xl shadow-md overflow-hidden">
    <!-- Header -->
    <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <BarChart3 class="w-5 h-5" />
        Query Results
      </h2>
    </div>
    
    <!-- Content -->
    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3 text-gray-600">
          <Loader2 class="w-5 h-5 animate-spin" />
          <span>Executing query...</span>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="result?.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 class="text-red-800 font-medium mb-1">Query Error</h3>
            <p class="text-red-700 text-sm">{{ result.error }}</p>
          </div>
        </div>
      </div>
      
      <!-- Success State - Data Results -->
      <div v-else-if="result?.success && result.data && result.data.length > 0">
        <!-- Query Info -->
        <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center gap-2 text-green-800">
            <CheckCircle2 class="w-4 h-4" />
            <span class="text-sm font-medium">
              Query executed successfully
            </span>
          </div>
          <div class="mt-1 text-green-700 text-sm">
            {{ result.data.length }} row(s) returned
            <span v-if="result.executionTime"> • {{ result.executionTime }}ms</span>
          </div>
        </div>
        
        <!-- Data Table -->
        <div class="overflow-x-auto border border-gray-200 rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th 
                  v-for="column in result.columns" 
                  :key="column"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(row, index) in result.data" :key="index" class="hover:bg-gray-50">
                <td 
                  v-for="column in result.columns" 
                  :key="`${index}-${column}`"
                  class="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                >
                  <span v-if="row[column] === null" class="text-gray-400 italic">NULL</span>
                  <span v-else-if="typeof row[column] === 'boolean'" 
                        :class="row[column] ? 'text-green-600' : 'text-red-600'">
                    {{ row[column] ? 'TRUE' : 'FALSE' }}
                  </span>
                  <span v-else>{{ formatValue(row[column]) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Success State - Non-Data Results -->
      <div v-else-if="result?.success" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <CheckCircle2 class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 class="text-blue-800 font-medium mb-1">Query Executed Successfully</h3>
            <p class="text-blue-700 text-sm">
              {{ result.message || 'Query completed successfully' }}
            </p>
            <div v-if="result.rowsAffected !== undefined" class="mt-1 text-blue-600 text-sm">
              {{ result.rowsAffected }} row(s) affected
              <span v-if="result.executionTime"> • {{ result.executionTime }}ms</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <Database class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Results</h3>
        <p class="text-gray-600">Execute a SQL query to see results here</p>
      </div>
      
      <!-- Raw JSON Console (Optional) -->
      <div v-if="result && showRawJson" class="mt-6">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-gray-700">Raw JSON Response</h4>
          <button
            @click="showRawJson = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">{{ JSON.stringify(result, null, 2) }}</pre>
      </div>
      
      <!-- Toggle JSON Button -->
      <div v-if="result && !showRawJson" class="mt-4 text-center">
        <button
          @click="showRawJson = true"
          class="text-gray-500 hover:text-gray-700 text-sm"
        >
          Show Raw JSON
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BarChart3, CheckCircle2, AlertCircle, Loader2, Database, X } from 'lucide-vue-next';
import type { QueryResult } from '../types';

defineProps<{
  result: QueryResult | null;
  loading: boolean;
}>();

const showRawJson = ref(false);

const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...';
  }
  
  return String(value);
};
</script>
