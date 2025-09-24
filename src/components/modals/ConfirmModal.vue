<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
      <div class="flex items-start">
        <div class="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle class="h-6 w-6 text-red-600" />
        </div>
        <div class="ml-4 text-left">
          <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          <div class="mt-2">
            <p class="text-sm text-gray-600">{{ message }}</p>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button @click="$emit('cancel')" class="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none">
          Cancel
        </button>
        <button @click="$emit('confirm')" class="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none">
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';

defineProps<{
  title: string;
  message: string;
}>();

defineEmits(['confirm', 'cancel']);
</script>
