<template>
  <div :class="compact ? 'space-y-2' : 'bg-white rounded-2xl shadow-md p-6'">
    <h3 v-if="compact" class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
      <Server class="w-4 h-4" />
      Server Connection
    </h3>
    
    <form @submit.prevent="handleConnect" :class="compact ? 'space-y-2' : 'space-y-4'">
      <div>
        <label for="host" :class="labelClass">Host</label>
        <input id="host" v-model="connection.host" type="text" placeholder="localhost" :class="inputClass" required />
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label for="port" :class="labelClass">Port</label>
          <input id="port" v-model.number="connection.port" type="number" placeholder="3306" :class="inputClass" required />
        </div>
        <div>
          <label for="username" :class="labelClass">User</label>
          <input id="username" v-model="connection.username" type="text" placeholder="root" :class="inputClass" required />
        </div>
      </div>
      
      <div>
        <label for="password" :class="labelClass">Password</label>
        <input id="password" v-model="connection.password" type="password" placeholder="••••••••" :class="inputClass" />
      </div>
      
      <button type="submit" :disabled="connecting" class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-1.5 px-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2">
        <Loader2 v-if="connecting" class="w-4 h-4 animate-spin" />
        <Wifi v-else class="w-4 h-4" />
        {{ connecting ? 'Connecting...' : 'Connect' }}
      </button>
    </form>
    
    <div v-if="connectionStatus" :class="['mt-2 p-2 rounded text-xs', connectionStatus.connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200']">
      <div class="flex items-center gap-2">
        <CheckCircle2 v-if="connectionStatus.connected" class="w-4 h-4 text-green-600" />
        <XCircle v-else class="w-4 h-4 text-red-600" />
        <span :class="['font-medium', connectionStatus.connected ? 'text-green-800' : 'text-red-800']">
          {{ connectionStatus.connected ? 'Connected' : 'Failed' }}
        </span>
      </div>
      <div v-if="connectionStatus.message || connectionStatus.error" :class="['mt-1', connectionStatus.connected ? 'text-green-700' : 'text-red-700']">
        {{ connectionStatus.connected ? connectionStatus.message : connectionStatus.error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { Server, Wifi, Loader2, CheckCircle2, XCircle } from 'lucide-vue-next';
import type { DatabaseConnection, ConnectionStatus } from '../types';
import { apiService, resetMockData } from '../services/apiService';

const props = defineProps<{
  compact?: boolean;
}>();

const emit = defineEmits<{
  connectionChanged: [connection: DatabaseConnection, status: ConnectionStatus];
}>();

const connection = reactive<DatabaseConnection>({
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: '', // Initially empty, user selects a DB after connecting
});

const connecting = ref(false);
const connectionStatus = ref<ConnectionStatus | null>(null);

const handleConnect = async (): Promise<void> => {
  connecting.value = true;
  connectionStatus.value = null;
  resetMockData(); // Reset demo data on every new connection attempt
  try {
    const status = await apiService.testConnection(connection);
    connectionStatus.value = status;
    emit('connectionChanged', { ...connection }, status);
  } catch (error) {
    const err = error as Error;
    connectionStatus.value = { connected: false, error: err.message };
  } finally {
    connecting.value = false;
  }
};

const baseLabelClass = 'block font-medium mb-1';
const labelClass = computed(() => props.compact ? `${baseLabelClass} text-xs text-gray-600` : `${baseLabelClass} text-sm text-gray-700`);

const baseInputClass = 'w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 transition';
const inputClass = computed(() => props.compact ? `${baseInputClass} px-2 py-1 text-xs` : `${baseInputClass} px-3 py-2`);
</script>
