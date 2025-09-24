import { ref, watch, Ref } from 'vue';

export function useLocalStorage<T>(key: string, defaultValue: T): [Ref<T>, (value: T) => void] {
  const storedValue = localStorage.getItem(key);
  const initial = storedValue ? JSON.parse(storedValue) : defaultValue;
  
  const storedRef = ref(initial) as Ref<T>;
  
  const setValue = (value: T) => {
    storedRef.value = value;
    localStorage.setItem(key, JSON.stringify(value));
  };
  
  watch(storedRef, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue));
  }, { deep: true });
  
  return [storedRef, setValue];
}
