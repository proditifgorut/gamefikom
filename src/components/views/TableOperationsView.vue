<template>
  <div class="space-y-8">
    <!-- Rename Table -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="text-lg font-medium text-gray-900 mb-3">Rename table to</h3>
      <form @submit.prevent="handleRename" class="flex items-center gap-2">
        <input 
          v-model="newTableName"
          type="text" 
          class="flex-grow border-gray-300 rounded-md shadow-sm text-sm"
          required
        />
        <button type="submit" class="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">
          Go
        </button>
      </form>
    </div>

    <!-- Table Maintenance -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="text-lg font-medium text-gray-900 mb-3">Table maintenance</h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
          <div>
            <h4 class="font-semibold">Truncate table</h4>
            <p class="text-xs text-gray-500">Empties the table by deleting all data.</p>
          </div>
          <button @click="handleTruncate" class="px-3 py-1.5 text-sm rounded-md bg-yellow-500 text-white hover:bg-yellow-600">
            Truncate
          </button>
        </div>
        <div class="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
          <div>
            <h4 class="font-semibold">Drop table</h4>
            <p class="text-xs text-gray-500">Permanently removes the table and its data.</p>
          </div>
          <button @click="handleDrop" class="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">
            Drop
          </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ConfirmModal from '../modals/ConfirmModal.vue';

const props = defineProps<{
  database: string;
  table: string;
}>();

const emit = defineEmits<{
  (e: 'executeQuery', query: string): void;
  (e: 'navigate', location: { db: string }): void;
}>();

const newTableName = ref(props.table);

// Modal state
const showConfirmModal = ref(false);
const confirmModalContent = ref({ title: '', message: '' });
const actionToConfirm = ref<(() => void) | null>(null);

const handleRename = () => {
  if (!newTableName.value || newTableName.value === props.table) return;
  const query = `RENAME TABLE \`${props.table}\` TO \`${newTableName.value}\`;`;
  emit('executeQuery', query);
  // Navigation should be handled by App.vue after successful rename
};

const handleTruncate = () => {
  confirmModalContent.value = {
    title: 'Truncate Table',
    message: `Are you sure you want to truncate the table \`${props.table}\`? All data will be permanently deleted.`
  };
  actionToConfirm.value = () => {
    const query = `TRUNCATE TABLE \`${props.table}\`;`;
    emit('executeQuery', query);
  };
  showConfirmModal.value = true;
};

const handleDrop = () => {
  confirmModalContent.value = {
    title: 'Drop Table',
    message: `Are you sure you want to permanently drop the table \`${props.table}\`? This action cannot be undone.`
  };
  actionToConfirm.value = () => {
    const query = `DROP TABLE \`${props.table}\`;`;
    emit('executeQuery', query);
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
</script>
