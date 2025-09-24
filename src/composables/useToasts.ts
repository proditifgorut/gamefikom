import { ref, readonly } from 'vue';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

export function useToasts() {
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = toastIdCounter++;
    const duration = toast.duration || 3000;
    
    toasts.value.push({ id, ...toast });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  return {
    toasts: readonly(toasts),
    addToast,
    removeToast,
  };
}
