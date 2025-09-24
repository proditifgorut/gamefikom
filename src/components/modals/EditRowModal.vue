<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
      <h3 class="text-lg font-semibold mb-4">Edit Row</h3>
      <form @submit.prevent="save" class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div v-for="col in schema" :key="col.name">
          <label :for="`edit-${col.name}`" class="block text-sm font-medium text-gray-700">{{ col.name }}</label>
          <input 
            :id="`edit-${col.name}`"
            v-model="editableRow[col.name]"
            :disabled="col.key === 'PRI'"
            type="text" 
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </form>
      <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button @click="$emit('cancel')" class="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300">Cancel</button>
        <button @click="save" class="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Save Changes</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TableSchema } from '../../types';

const props = defineProps<{
  row: any;
  schema: TableSchema[];
}>();

const emit = defineEmits(['save', 'cancel']);

const editableRow = ref({ ...props.row });

const save = () => {
  emit('save', editableRow.value);
};
</script>
