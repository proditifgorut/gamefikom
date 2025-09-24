<template>
  <div 
    class="flex items-start p-4 rounded-lg shadow-lg text-white max-w-sm transition-all duration-300"
    :class="toastClasses"
  >
    <div class="flex-shrink-0">
      <component :is="icon" class="w-5 h-5" />
    </div>
    <div class="ml-3 flex-1">
      <p class="text-sm font-medium">{{ toast.message }}</p>
    </div>
    <div class="ml-4 flex-shrink-0 flex">
      <button @click="$emit('close')" class="inline-flex rounded-md text-white/70 hover:text-white focus:outline-none">
        <X class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-vue-next';
import type { Toast } from '../composables/useToasts';

const props = defineProps<{
  toast: Toast;
}>();

defineEmits(['close']);

const toastClasses = computed(() => ({
  'bg-green-500': props.toast.type === 'success',
  'bg-red-500': props.toast.type === 'error',
  'bg-blue-500': props.toast.type === 'info',
}));

const icon = computed(() => {
  switch (props.toast.type) {
    case 'success': return CheckCircle;
    case 'error': return AlertTriangle;
    case 'info': return Info;
    default: return Info;
  }
});
</script>
