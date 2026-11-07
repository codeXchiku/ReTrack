import type { Db } from '@/core/db';
import {
  getLatestMigrationId,
  type Migration,
  runMigrations,
} from '@/core/db/migrate';

function createFakeDb(): Db & {
  readonly executed: string[];
  readonly schemaMigrations: { id: number; name: string; applied_at: number }[];
} {
  let executed: string[] = [];
  let schemaMigrations: { id: number; name: string; applied_at: number }[] = [];

  return {
    get executed() {
      return executed;
    },
    get schemaMigrations() {
      return schemaMigrations;
    },
    async exec(sql: string, params: unknown[] = []): Promise<void> {
      if (sql.includes('FAIL_ME')) {
        throw new Error('Simulated SQL syntax error');
      }
      executed.push(sql.trim());
      if (sql.includes('INSERT INTO schema_migrations')) {
        const [id, name, applied_at] = params as [number, string, number];
        schemaMigrations.push({ id, name, applied_at });
      }
    },

    async query<T>(sql: string): Promise<T[]> {
      if (sql.includes('FROM schema_migrations')) {
        if (sql.includes('MAX(id)')) {
          const maxId =
            schemaMigrations.length > 0
              ? Math.max(...schemaMigrations.map(m => m.id))
              : null;
          return [{ maxId }] as unknown as T[];
        }
        return schemaMigrations
          .slice()
          .sort((a, b) => a.id - b.id) as unknown as T[];
      }
      return [] as T[];
    },

    async queryOne<T>(sql: string): Promise<T | null> {
      const rows = await this.query<T>(sql);
      return rows[0] ?? null;
    },

    async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
      const execSnapshot = [...executed];
      const migrationsSnapshot = [...schemaMigrations];
      try {
        return await fn(this);
      } catch (err) {
        executed = execSnapshot;
        schemaMigrations = migrationsSnapshot;
        throw err;
      }
    },
  };
}

describe('runMigrations and getLatestMigrationId', () => {
  it('runs migrations in order and updates schema_migrations', async () => {
    const db = createFakeDb();
    const testMigrations: Migration[] = [
      { id: 1, name: '0001_initial', up: ['CREATE TABLE t1 (id INT);'] },
      { id: 2, name: '0002_add_t2', up: ['CREATE TABLE t2 (id INT);'] },
    ];

    expect(await getLatestMigrationId(db)).toBeNull();

    await runMigrations(db, testMigrations, 1000);

    expect(db.schemaMigrations).toEqual([
      { id: 1, name: '0001_initial', applied_at: 1000 },
      { id: 2, name: '0002_add_t2', applied_at: 1000 },
    ]);
    expect(await getLatestMigrationId(db)).toBe(2);
  });

  it('throws an error if migration IDs have duplicates or wrong starting sequence', async () => {
    const db = createFakeDb();
    const duplicateMigrations: Migration[] = [
      { id: 1, name: '0001_a', up: [] },
      { id: 1, name: '0001_b', up: [] },
    ];

    await expect(runMigrations(db, duplicateMigrations)).rejects.toThrow(
      'Invalid migration sequence: expected migration id 2, got 1',
    );
  });

  it('throws an error if migration IDs have a gap', async () => {
    const db = createFakeDb();
    const gappedMigrations: Migration[] = [
      { id: 1, name: '0001_a', up: [] },
      { id: 3, name: '0003_c', up: [] },
    ];

    await expect(runMigrations(db, gappedMigrations)).rejects.toThrow(
      'Invalid migration sequence: expected migration id 2, got 3',
    );
  });

  it('is idempotent: running a second time does not re-apply existing migrations', async () => {
    const db = createFakeDb();
    const testMigrations: Migration[] = [
      { id: 1, name: '0001_initial', up: ['CREATE TABLE t1 (id INT);'] },
    ];

    await runMigrations(db, testMigrations, 1000);
    expect(db.schemaMigrations).toHaveLength(1);

    const execCountBefore = db.executed.length;
    await runMigrations(db, testMigrations, 2000);

    // No new migration inserts or up statements executed
    expect(db.schemaMigrations).toHaveLength(1);
    expect(db.executed.filter(s => s.includes('CREATE TABLE t1'))).toHaveLength(1);
    expect(db.executed.length - execCountBefore).toBeLessThanOrEqual(2);
  });

  it('rolls back on error: leaves earlier migrations intact and table clean', async () => {
    const db = createFakeDb();
    const testMigrations: Migration[] = [
      { id: 1, name: '0001_initial', up: ['CREATE TABLE t1 (id INT);'] },
      {
        id: 2,
        name: '0002_broken',
        up: ['CREATE TABLE t2_rolled_back (id INT);', 'FAIL_ME'],
      },
    ];

    await expect(runMigrations(db, testMigrations, 1000)).rejects.toThrow(
      'Migration 2 (0002_broken) failed: Simulated SQL syntax error',
    );

    // Migration 1 remains applied
    expect(db.schemaMigrations).toEqual([
      { id: 1, name: '0001_initial', applied_at: 1000 },
    ]);
    expect(await getLatestMigrationId(db)).toBe(1);

    // Migration 2 statements executed before failure were rolled back
    expect(
      db.executed.includes('CREATE TABLE t2_rolled_back (id INT);'),
    ).toBe(false);
  });
});
