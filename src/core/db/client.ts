import { open, type Scalar } from '@op-engineering/op-sqlite';

/**
 * Common database interface.
 * All feature repositories and migration runners communicate through this abstraction,
 * enabling lightweight fakes in unit tests.
 */
export type Db = {
  exec(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
};

let currentDb: Db | null = null;

/**
 * Accessor for the active initialized Db instance.
 * Throws if called before bootstrap completes.
 */
export function getDb(): Db {
  if (!currentDb) {
    throw new Error('Database is not initialized. Call bootstrap() first.');
  }
  return currentDb;
}

/**
 * Sets or overrides the active database instance (used by bootstrap and tests).
 */
export function setDb(db: Db | null): void {
  currentDb = db;
}

let savepointCounter = 0;

/**
 * Executes a transaction block using SQLite SAVEPOINT for robust nesting support.
 */
export async function runSavepointTransaction<T>(
  db: Db,
  fn: (tx: Db) => Promise<T>,
): Promise<T> {
  const spName = `sp_${++savepointCounter}`;
  await db.exec(`SAVEPOINT ${spName};`);
  try {
    const result = await fn(db);
    await db.exec(`RELEASE SAVEPOINT ${spName};`);
    return result;
  } catch (err) {
    await db.exec(`ROLLBACK TO SAVEPOINT ${spName};`);
    await db.exec(`RELEASE SAVEPOINT ${spName};`);
    throw err;
  }
}

/**
 * Opens "studydojo.db" via op-sqlite and enables foreign keys and WAL journal mode.
 */
export async function openDatabase(name: string = 'studydojo.db'): Promise<Db> {
  const sqlite = open({ name });

  const db: Db = {
    async exec(sql: string, params?: unknown[]): Promise<void> {
      await sqlite.execute(sql, (params as Scalar[]) ?? []);
    },

    async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
      const result = await sqlite.execute(sql, (params as Scalar[]) ?? []);
      return (result.rows as unknown as T[]) ?? [];
    },

    async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
      const rows = await this.query<T>(sql, params);
      return rows[0] ?? null;
    },

    async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
      return runSavepointTransaction(this, fn);
    },
  };

  await db.exec('PRAGMA foreign_keys = ON;');
  await db.exec('PRAGMA journal_mode = WAL;');

  return db;
}
