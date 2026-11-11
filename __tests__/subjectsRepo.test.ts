import type { Db } from '@/core/db';
import { subjectColors } from '@/core/theme';
import {
  type Subject,
  createSubject,
  deleteSubject,
  getSubject,
  listSubjects,
  updateSubject,
} from '@/features/subjects/data/subjectsRepo';

function createFakeSubjectDb(): Db & {
  subjects: Subject[];
} {
  const subjects: Subject[] = [];

  return {
    get subjects() {
      return subjects;
    },
    async exec(sql: string, params: unknown[] = []): Promise<void> {
      if (sql.startsWith('INSERT INTO subjects')) {
        const [id, name, color, sort_order, created_at] = params as [
          string,
          string,
          string,
          number,
          number,
        ];

        // Simulate UNIQUE INDEX on name COLLATE NOCASE
        if (
          subjects.some(
            s => s.name.toLowerCase() === name.trim().toLowerCase(),
          )
        ) {
          throw new Error('UNIQUE constraint failed: subjects.name');
        }

        subjects.push({
          id,
          name: name.trim(),
          color,
          sort_order,
          created_at,
        });
      } else if (sql.startsWith('UPDATE subjects')) {
        const [name, color, sort_order, id] = params as [
          string,
          string,
          number,
          string,
        ];

        // Check unique constraint for other subjects
        if (
          subjects.some(
            s =>
              s.id !== id &&
              s.name.toLowerCase() === name.trim().toLowerCase(),
          )
        ) {
          throw new Error('UNIQUE constraint failed: subjects.name');
        }

        const idx = subjects.findIndex(s => s.id === id);
        if (idx !== -1) {
          const prev = subjects[idx];
          if (prev) {
            subjects[idx] = {
              id: prev.id,
              name: name.trim(),
              color,
              sort_order,
              created_at: prev.created_at,
            };
          }
        }
      } else if (sql.startsWith('DELETE FROM subjects')) {
        const [id] = params as [string];
        const idx = subjects.findIndex(s => s.id === id);
        if (idx !== -1) {
          subjects.splice(idx, 1);
        }
      }
    },

    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      if (sql.includes('SELECT name FROM subjects WHERE id !=')) {
        const [excludeId] = params as [string];
        return subjects
          .filter(s => s.id !== excludeId)
          .map(s => ({ name: s.name })) as unknown as T[];
      }
      if (sql.includes('SELECT name FROM subjects')) {
        return subjects.map(s => ({ name: s.name })) as unknown as T[];
      }
      if (sql.includes('FROM subjects ORDER BY')) {
        return [...subjects].sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
          return a.created_at - b.created_at;
        }) as unknown as T[];
      }
      return [] as T[];
    },

    async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      if (sql.includes('WHERE id = ?')) {
        const [id] = params as [string];
        const found = subjects.find(s => s.id === id);
        return (found as unknown as T) ?? null;
      }
      return null;
    },

    async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
      return fn(this);
    },
  };
}

describe('subjectsRepo', () => {
  const color1 = subjectColors[0]?.color ?? '#3B82F6';
  const color2 = subjectColors[1]?.color ?? '#EF4444';

  it('creates, lists, and retrieves subjects', async () => {
    const db = createFakeSubjectDb();

    const result = await createSubject(
      { name: 'Physics', color: color1 },
      db,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.name).toBe('Physics');
    expect(result.value.color).toBe(color1);
    expect(result.value.id).toBeDefined();

    const list = await listSubjects(db);
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(result.value.id);

    const fetched = await getSubject(result.value.id, db);
    expect(fetched?.name).toBe('Physics');
  });

  it('maps unique constraint failures to error "duplicate"', async () => {
    const db = createFakeSubjectDb();

    const first = await createSubject({ name: 'History', color: color1 }, db);
    expect(first.ok).toBe(true);

    const second = await createSubject({ name: 'history', color: color2 }, db);
    expect(second).toEqual({
      ok: false,
      error: 'duplicate',
    });
  });

  it('updates subject name, color and sort_order', async () => {
    const db = createFakeSubjectDb();

    const created = await createSubject({ name: 'Bio', color: color1 }, db);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const updated = await updateSubject(
      created.value.id,
      { name: 'Biology', color: color2, sort_order: 5 },
      db,
    );
    expect(updated.ok).toBe(true);
    if (!updated.ok) {
      return;
    }

    expect(updated.value.name).toBe('Biology');
    expect(updated.value.color).toBe(color2);
    expect(updated.value.sort_order).toBe(5);

    const fetched = await getSubject(created.value.id, db);
    expect(fetched?.name).toBe('Biology');
  });

  it('prevents update to a name already used by another subject', async () => {
    const db = createFakeSubjectDb();

    await createSubject({ name: 'Math', color: color1 }, db);
    const chem = await createSubject({ name: 'Chem', color: color2 }, db);
    expect(chem.ok).toBe(true);
    if (!chem.ok) {
      return;
    }

    const collision = await updateSubject(
      chem.value.id,
      { name: 'math' },
      db,
    );
    expect(collision).toEqual({
      ok: false,
      error: 'duplicate',
    });
  });

  it('deletes a subject by ID', async () => {
    const db = createFakeSubjectDb();

    const sub = await createSubject({ name: 'English', color: color1 }, db);
    expect(sub.ok).toBe(true);
    if (!sub.ok) {
      return;
    }

    await deleteSubject(sub.value.id, db);
    const fetched = await getSubject(sub.value.id, db);
    expect(fetched).toBeNull();

    const list = await listSubjects(db);
    expect(list).toHaveLength(0);
  });
});
