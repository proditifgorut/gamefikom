export interface DatabaseConnection {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string; // This can be an initial database, but can be changed.
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  message?: string;
  error?: string;
  rowsAffected?: number;
  executionTime?: number;
  totalRows?: number; // For pagination
}

export interface ConnectionStatus {
  connected: boolean;
  message?: string;
  error?: string;
  databases?: string[]; // A list of all available databases on the server
}

export interface TableSchema {
  name: string;
  type: string;
  null: boolean;
  key: 'PRI' | 'UNI' | 'MUL' | '';
  default: string | null;
  extra: string;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableDetails {
  name: string;
  rows: number;
  engine: string;
  collation: string;
  schema: TableSchema[];
  data: any[];
}

export interface DatabaseDetails {
  [tableName: string]: TableDetails;
}

export interface ServerDetails {
  [databaseName: string]: DatabaseDetails;
}

export interface Sort {
  column: string;
  direction: 'asc' | 'desc';
}
