import { ref } from 'vue';
import axios from 'axios';
import type { DatabaseConnection, QueryResult, ConnectionStatus, ServerDetails, TableSchema, Sort } from '../types';
import { cloneDeep } from '../utils/cloneDeep';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- MOCK SERVER DATA ---
const initialMockServer: ServerDetails = {
  'demo_db': {
    'users': {
      name: 'users', rows: 5, engine: 'InnoDB', collation: 'utf8mb4_unicode_ci',
      schema: [
        { name: 'id', type: 'int(11)', null: false, key: 'PRI', default: null, extra: 'AUTO_INCREMENT' },
        { name: 'name', type: 'varchar(255)', null: false, key: '', default: null, extra: '' },
        { name: 'email', type: 'varchar(255)', null: false, key: 'UNI', default: null, extra: '' },
        { name: 'created_at', type: 'timestamp', null: true, key: '', default: 'CURRENT_TIMESTAMP', extra: '' },
      ],
      data: [
        { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2025-01-15 10:30:00' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2025-01-16 14:20:00' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2025-01-17 09:15:00' },
        { id: 4, name: 'Alice Brown', email: 'alice@example.com', created_at: '2025-01-18 16:45:00' },
        { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', created_at: '2025-01-19 11:30:00' },
      ]
    },
    'products': {
      name: 'products', rows: 3, engine: 'InnoDB', collation: 'utf8mb4_unicode_ci',
      schema: [
        { name: 'id', type: 'int(11)', null: false, key: 'PRI', default: null, extra: 'AUTO_INCREMENT' },
        { name: 'name', type: 'varchar(255)', null: false, key: '', default: null, extra: '' },
        { name: 'price', type: 'decimal(10,2)', null: false, key: '', default: null, extra: '' },
        { name: 'stock', type: 'int(11)', null: false, key: '', default: '0', extra: '' },
      ],
      data: [
        { id: 1, name: 'Laptop', price: 999.99, stock: 15 },
        { id: 2, name: 'Smartphone', price: 699.99, stock: 25 },
        { id: 3, name: 'Headphones', price: 199.99, stock: 50 },
      ]
    }
  },
  'company_db': {
    'employees': {
      name: 'employees', rows: 4, engine: 'InnoDB', collation: 'utf8mb4_unicode_ci',
      schema: [
        { name: 'emp_id', type: 'int(11)', null: false, key: 'PRI', default: null, extra: 'AUTO_INCREMENT' },
        { name: 'first_name', type: 'varchar(50)', null: false, key: '', default: null, extra: '' },
        { name: 'last_name', type: 'varchar(50)', null: false, key: '', default: null, extra: '' },
        { name: 'department_id', type: 'int(11)', null: true, key: 'MUL', default: null, extra: '', references: { table: 'departments', column: 'dept_id' } },
      ],
      data: [
        { emp_id: 101, first_name: 'Sarah', last_name: 'Connor', department_id: 1 },
        { emp_id: 102, first_name: 'Kyle', last_name: 'Reese', department_id: 2 },
        { emp_id: 103, first_name: 'Miles', last_name: 'Dyson', department_id: 1 },
        { emp_id: 104, first_name: 'Peter', last_name: 'Silberman', department_id: 3 },
      ]
    },
    'departments': {
      name: 'departments', rows: 3, engine: 'InnoDB', collation: 'utf8mb4_unicode_ci',
      schema: [
        { name: 'dept_id', type: 'int(11)', null: false, key: 'PRI', default: null, extra: 'AUTO_INCREMENT' },
        { name: 'dept_name', type: 'varchar(100)', null: false, key: 'UNI', default: null, extra: '' },
      ],
      data: [
        { dept_id: 1, dept_name: 'Engineering' },
        { dept_id: 2, dept_name: 'Security' },
        { dept_id: 3, dept_name: 'Psychology' },
      ]
    }
  },
  'system_db': {
    'logs': {
      name: 'logs', rows: 2, engine: 'MyISAM', collation: 'utf8_general_ci',
      schema: [
        { name: 'log_id', type: 'bigint(20)', null: false, key: 'PRI', default: null, extra: 'AUTO_INCREMENT' },
        { name: 'level', type: 'varchar(10)', null: false, key: '', default: null, extra: '' },
        { name: 'message', type: 'text', null: false, key: '', default: null, extra: '' },
        { name: 'log_time', type: 'datetime', null: false, key: '', default: null, extra: '' },
      ],
      data: [
        { log_id: 1, level: 'INFO', message: 'Server started', log_time: '2025-07-20 08:00:00' },
        { log_id: 2, level: 'WARN', message: 'Disk space low', log_time: '2025-07-20 09:30:00' },
      ]
    }
  }
};

const mockServer = ref<ServerDetails>(cloneDeep(initialMockServer));
export const reactiveMockServer = mockServer;

let backendAvailable: boolean | null = null;

const checkBackendAvailability = async (): Promise<boolean> => {
  if (backendAvailable !== null) return backendAvailable;
  try {
    await api.get('/health', { timeout: 1500 });
    backendAvailable = true;
    return true;
  } catch {
    backendAvailable = false;
    return false;
  }
};

const simulateNetworkDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

const getPrimaryKey = (table: any): string | null => {
  const pk = table.schema.find((col: TableSchema) => col.key === 'PRI');
  return pk ? pk.name : null;
};

const mockQueryProcessor = async (query: string, currentDb: string): Promise<QueryResult> => {
  await simulateNetworkDelay();
  const startTime = performance.now();
  const normalizedQuery = query.toLowerCase().trim().replace(/;$/, '');

  const getExecutionTime = () => Math.round(performance.now() - startTime);

  // --- DATABASE LEVEL ---
  if (normalizedQuery === 'show databases') {
    const databases = Object.keys(mockServer.value);
    return { success: true, data: databases.map(db => ({ 'Database': db })), columns: ['Database'], executionTime: getExecutionTime() };
  }
  const createDbMatch = /create database\s+`?([a-zA-Z0-9_]+)`?/.exec(normalizedQuery);
  if (createDbMatch) {
    const dbName = createDbMatch[1];
    if (mockServer.value[dbName]) return { success: false, error: `Database '${dbName}' already exists.` };
    mockServer.value[dbName] = {};
    return { success: true, message: `Database '${dbName}' created.`, executionTime: getExecutionTime() };
  }
  const dropDbMatch = /drop database\s+`?([a-zA-Z0-9_]+)`?/.exec(normalizedQuery);
  if (dropDbMatch) {
    const dbName = dropDbMatch[1];
    if (!mockServer.value[dbName]) return { success: false, error: `Database '${dbName}' does not exist.` };
    delete mockServer.value[dbName];
    return { success: true, message: `Database '${dbName}' dropped.`, executionTime: getExecutionTime() };
  }
  
  const useDbMatch = /use\s+`?([a-zA-Z0-9_]+)`?/.exec(normalizedQuery);
  if (useDbMatch) {
    const dbName = useDbMatch[1];
    if (!mockServer.value[dbName]) return { success: false, error: `Unknown database '${dbName}'` };
    // In a real scenario, this changes the connection context. Here, we just acknowledge it.
    return { success: true, message: `Database changed to '${dbName}'.` };
  }

  // --- TABLE LEVEL ---
  const db = mockServer.value[currentDb];
  if (!db && !normalizedQuery.startsWith('create database')) {
    return { success: false, error: 'No database selected.' };
  }

  if (normalizedQuery.startsWith('show tables')) {
    const tables = Object.keys(db);
    const colName = `Tables_in_${currentDb}`;
    return { success: true, data: tables.map(t => ({ [colName]: t })), columns: [colName], executionTime: getExecutionTime() };
  }

  const createTableMatch = /create table\s+`?(\w+)`?\s*\(([\s\S]+)\)/.exec(query.trim()); // Use original query for case-sensitive parsing
  if (createTableMatch) {
    const tableName = createTableMatch[1];
    if (db[tableName]) return { success: false, error: `Table '${tableName}' already exists.` };
    
    const schema: TableSchema[] = [];
    const pkMatch = /primary key\s*\((`?\w+`?)\)/i.exec(createTableMatch[2]);
    const primaryKey = pkMatch ? pkMatch[1].replace(/`/g, '') : null;
    
    const columnDefs = createTableMatch[2].split(/,(?![^()]*\))/);

    for (const colDef of columnDefs) {
        if (colDef.trim().toLowerCase().startsWith('primary key')) continue;

        const parts = colDef.trim().split(/\s+/);
        if (parts.length < 2) continue;

        const name = parts[0].replace(/`/g, '');
        const type = parts[1];
        const isNull = !/not null/i.test(colDef);
        const isAutoIncrement = /auto_increment/i.test(colDef);
        let key: TableSchema['key'] = '';
        if (name === primaryKey || /primary key/i.test(colDef)) key = 'PRI';
        else if (/unique/i.test(colDef)) key = 'UNI';
        
        const defaultMatch = /default\s+'([^']*)'/i.exec(colDef);
        const defaultValue = defaultMatch ? defaultMatch[1] : null;

        schema.push({ name, type, null: isNull, key, default: defaultValue, extra: isAutoIncrement ? 'AUTO_INCREMENT' : '' });
    }

    db[tableName] = { name: tableName, rows: 0, engine: 'InnoDB', collation: 'utf8mb4_unicode_ci', schema, data: [] };
    return { success: true, message: `Table '${tableName}' created.`, executionTime: getExecutionTime() };
  }

  const dropTableMatch = /drop table\s+`?(\w+)`?/.exec(normalizedQuery);
  if (dropTableMatch) {
    const tableName = dropTableMatch[1];
    if (!db[tableName]) return { success: false, error: `Table '${tableName}' does not exist.` };
    delete db[tableName];
    return { success: true, message: `Table '${tableName}' dropped.` };
  }

  const truncateTableMatch = /truncate table\s+`?(\w+)`?/.exec(normalizedQuery);
  if (truncateTableMatch) {
    const tableName = truncateTableMatch[1];
    if (!db[tableName]) return { success: false, error: `Table '${tableName}' does not exist.` };
    db[tableName].data = [];
    db[tableName].rows = 0;
    return { success: true, message: `Table '${tableName}' has been truncated.` };
  }

  const renameTableMatch = /rename table\s+`?(\w+)`?\s+to\s+`?(\w+)`?/.exec(normalizedQuery);
  if (renameTableMatch) {
    const oldName = renameTableMatch[1];
    const newName = renameTableMatch[2];
    if (!db[oldName]) return { success: false, error: `Table '${oldName}' does not exist.` };
    if (db[newName]) return { success: false, error: `Table '${newName}' already exists.` };
    db[newName] = { ...db[oldName], name: newName };
    delete db[oldName];
    return { success: true, message: `Table '${oldName}' renamed to '${newName}'.` };
  }

  const alterTableMatch = /alter table\s+`?(\w+)`?/.exec(normalizedQuery);
  if (alterTableMatch) {
    const tableName = alterTableMatch[1];
    const table = db[tableName];
    if (!table) return { success: false, error: `Table '${tableName}' not found.` };

    const dropColumnMatch = /drop column\s+`?(\w+)`?/.exec(normalizedQuery);
    if (dropColumnMatch) {
      const colName = dropColumnMatch[1];
      table.schema = table.schema.filter(c => c.name !== colName);
      table.data.forEach(row => delete row[colName]);
      return { success: true, message: `Column '${colName}' dropped.` };
    }

    const addColumnMatch = /add column\s+`?(\w+)`?\s+([\w\(\)]+)/.exec(normalizedQuery);
    if (addColumnMatch) {
      const colName = addColumnMatch[1];
      const colType = addColumnMatch[2];
      table.schema.push({ name: colName, type: colType, null: true, key: '', default: null, extra: '' });
      table.data.forEach(row => row[colName] = null);
      return { success: true, message: `Column '${colName}' added.` };
    }
  }

  // --- ROW LEVEL ---
  if (normalizedQuery.startsWith('select')) {
    const tableMatch = /from\s+`?(\w+)`?/.exec(normalizedQuery);
    if (tableMatch && tableMatch[1]) {
      const tableName = tableMatch[1];
      const table = db[tableName];
      if (table) {
        let data = [...table.data];
        const totalRows = data.length;

        const orderMatch = /order by\s+`?(\w+)`?\s+(asc|desc)/.exec(normalizedQuery);
        if (orderMatch) {
          const col = orderMatch[1];
          const dir = orderMatch[2];
          data.sort((a, b) => {
            if (a[col] < b[col]) return dir === 'asc' ? -1 : 1;
            if (a[col] > b[col]) return dir === 'asc' ? 1 : -1;
            return 0;
          });
        }

        const limitMatch = /limit\s+(\d+)/.exec(normalizedQuery);
        const offsetMatch = /offset\s+(\d+)/.exec(normalizedQuery);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1]);
          const offset = offsetMatch ? parseInt(offsetMatch[1]) : 0;
          data = data.slice(offset, offset + limit);
        }

        return { success: true, data, columns: table.schema.map(s => s.name), totalRows, executionTime: getExecutionTime() };
      }
    }
    return { success: false, error: `Table not found in database '${currentDb}'` };
  }

  const insertMatch = /insert into\s+`?(\w+)`?\s*(?:\(([^)]+)\))?\s+values\s*\(([^)]+)\)/.exec(query.trim());
  if (insertMatch) {
    const tableName = insertMatch[1];
    const table = db[tableName];
    if (!table) return { success: false, error: `Table '${tableName}' not found.` };
    
    const columns = insertMatch[2] ? insertMatch[2].split(',').map(c => c.trim().replace(/`/g, '')) : table.schema.filter(c => c.extra !== 'AUTO_INCREMENT').map(c => c.name);
    const values = insertMatch[3].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
    
    const newRow: any = {};
    const pk = getPrimaryKey(table);
    if(pk && table.schema.find(c => c.name === pk)?.extra === 'AUTO_INCREMENT') {
        let maxId = 0;
        table.data.forEach(r => { if(r[pk] > maxId) maxId = r[pk]; });
        newRow[pk] = maxId + 1;
    }

    columns.forEach((col, i) => { newRow[col] = values[i]; });
    table.data.push(newRow);
    table.rows = table.data.length;
    return { success: true, message: '1 row inserted.', rowsAffected: 1, executionTime: getExecutionTime() };
  }

  const updateMatch = /update\s+`?(\w+)`?\s+set\s+(.+)\s+where\s+`?(\w+)`?\s*=\s*'?(.*?)'?$/.exec(query.trim());
  if (updateMatch) {
      const tableName = updateMatch[1];
      const table = db[tableName];
      if (!table) return { success: false, error: `Table not found` };

      const whereCol = updateMatch[3];
      const whereVal = isNaN(Number(updateMatch[4])) ? updateMatch[4] : Number(updateMatch[4]);
      
      const rowToUpdate = table.data.find(r => r[whereCol] == whereVal);
      if (!rowToUpdate) return { success: false, error: `Row not found` };

      const setClauses = updateMatch[2].split(',');
      setClauses.forEach(clause => {
          const [col, val] = clause.split('=').map(s => s.trim().replace(/[`']/g, ''));
          rowToUpdate[col] = isNaN(Number(val)) ? val : Number(val);
      });
      return { success: true, message: `1 row updated.`, rowsAffected: 1 };
  }

  const deleteMatch = /delete from\s+`?(\w+)`?\s+where\s+`?(\w+)`?\s+in\s+\(([^)]+)\)/.exec(normalizedQuery);
  if (deleteMatch) {
    const tableName = deleteMatch[1];
    const table = db[tableName];
    if (!table) return { success: false, error: `Table '${tableName}' not found.` };
    
    const whereCol = deleteMatch[2];
    const idsToDelete = deleteMatch[3].split(',').map(id => parseInt(id.trim()));
    
    const initialCount = table.data.length;
    table.data = table.data.filter(row => !idsToDelete.includes(row[whereCol]));
    const rowsAffected = initialCount - table.data.length;
    table.rows = table.data.length;
    
    return { success: true, message: `${rowsAffected} row(s) deleted.`, rowsAffected, executionTime: getExecutionTime() };
  }

  return { success: false, error: `Unsupported or invalid SQL query in demo mode: ${normalizedQuery.substring(0, 50)}...` };
};

export const resetMockData = () => {
  mockServer.value = cloneDeep(initialMockServer);
};

export const apiService = {
  async testConnection(connection: DatabaseConnection): Promise<ConnectionStatus> {
    const isBackendAvailable = await checkBackendAvailability();
    if (!isBackendAvailable) {
      await simulateNetworkDelay();
      resetMockData(); // Reset on new connection
      return {
        connected: true,
        message: 'Connected in Demo Mode.',
        databases: Object.keys(mockServer.value),
      };
    }
    try {
      const response = await api.post('/connect', connection);
      return {
        connected: true,
        message: response.data.message || 'Connection successful',
        databases: response.data.databases,
      };
    } catch (error: any) {
      console.error('Connection error:', error);
      if (error.code === 'ERR_NETWORK') {
        backendAvailable = false;
        return this.testConnection(connection);
      }
      return { connected: false, error: error.response?.data?.error || 'Connection failed' };
    }
  },

  async executeQuery(query: string, connection: DatabaseConnection): Promise<QueryResult> {
    const isBackendAvailable = await checkBackendAvailability();
    if (!isBackendAvailable) {
      return mockQueryProcessor(query, connection.database);
    }
    try {
      const response = await api.post('/query', { query: query.trim(), connection });
      return { ...response.data, success: true };
    } catch (error: any) {
      console.error('Query error:', error);
      if (error.code === 'ERR_NETWORK') {
        backendAvailable = false;
        return this.executeQuery(query, connection);
      }
      return { success: false, error: error.response?.data?.error || 'Query failed' };
    }
  },

  async executeScript(script: string, connection: DatabaseConnection): Promise<QueryResult[]> {
    const queries = script.split(';').map(q => q.trim()).filter(q => q.length > 0);
    const results: QueryResult[] = [];
    let currentDb = connection.database;

    for (const query of queries) {
        const useDbMatch = /use\s+`?([a-zA-Z0-9_]+)`?/i.exec(query);
        if (useDbMatch) {
            currentDb = useDbMatch[1];
        }
        const result = await this.executeQuery(query, { ...connection, database: currentDb });
        results.push(result);
        if (!result.success) {
            // Optionally stop on first error
            // break;
        }
    }
    return results;
  },
  
  isDemoMode: () => backendAvailable === false,

  getMockServerState: () => {
    if (backendAvailable === false) {
      return cloneDeep(mockServer.value);
    }
    return null;
  }
};
