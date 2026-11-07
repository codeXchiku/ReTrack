import type { Db } from './client';

export type Migration = {
  id: number;
  name: string;
  up: string[];
};

/**
 * Returns the highest applied migration ID, or null if no migrations have been applied.
 */
export async function getLatestMigrationId(db: Db): Promise<number | null> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  const row = await db.queryOne<{ maxId: number | null }>(
    'SELECT MAX(id) as maxId FROM schema_migrations;',
  );
  return row?.maxId ?? null;
}

/**
 * Validates and executes pending database migrations in strict sequential order.
 * Each migration runs with its schema_migrations record in an atomic transaction.
 */
export async function runMigrations(
  db: Db,
  migrations: Migration[],
  now: number = Date.now(),
): Promise<void> {
  // Validate migrations list: IDs must be unique and strictly increasing (1, 2, 3...)
  for (let i = 0; i < migrations.length; i++) {
    const expectedId = i + 1;
    const migration = migrations[i]!;
    if (migration.id !== expectedId) {
      throw new Error(
        `Invalid migration sequence: expected migration id ${expectedId}, got ${migration.id} (${migration.name})`,
      );
    }
  }

  // Ensure schema_migrations table exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  // Fetch already applied migrations
  const appliedRows = await db.query<{ id: number }>(
    'SELECT id FROM schema_migrations ORDER BY id ASC;',
  );
  const appliedIds = new Set(appliedRows.map(r => r.id));

  // Run pending migrations in order
  const pending = migrations.filter(m => !appliedIds.has(m.id));

  for (const m of pending) {
    try {
      await db.transaction(async tx => {
        for (const statement of m.up) {
          await tx.exec(statement);
        }
        await tx.exec(
          'INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);',
          [m.id, m.name, now],
        );
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Migration ${m.id} (${m.name}) failed: ${message}`);
    }
  }
}
