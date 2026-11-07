import { type Db, getDb } from '@/core/db';
import { createId } from '@/core/utils';
import {
  type SubjectValidationError,
  validateSubject,
} from '../logic/validateSubject';

export type Subject = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: number;
};

export type SubjectResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SubjectValidationError };

export type CreateSubjectInput = {
  name: string;
  color: string;
  sort_order?: number;
  created_at?: number;
};

export type UpdateSubjectInput = {
  name?: string;
  color?: string;
  sort_order?: number;
};

function isUniqueConstraintError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('unique constraint') ||
      msg.includes('sqlite_constraint') ||
      msg.includes('code 19') ||
      msg.includes('duplicate')
    );
  }
  return false;
}

/**
 * Returns all subjects sorted by sort_order ASC, created_at ASC.
 */
export async function listSubjects(db?: Db): Promise<Subject[]> {
  const database = db ?? getDb();
  return database.query<Subject>(
    'SELECT id, name, color, sort_order, created_at FROM subjects ORDER BY sort_order ASC, created_at ASC;',
  );
}

/**
 * Finds a single subject by ID.
 */
export async function getSubject(
  id: string,
  db?: Db,
): Promise<Subject | null> {
  const database = db ?? getDb();
  return database.queryOne<Subject>(
    'SELECT id, name, color, sort_order, created_at FROM subjects WHERE id = ?;',
    [id],
  );
}

/**
 * Creates a new subject after validation.
 * Never throws for validation or unique constraint errors.
 */
export async function createSubject(
  input: CreateSubjectInput,
  db?: Db,
): Promise<SubjectResult<Subject>> {
  const database = db ?? getDb();

  // Query existing names to validate uniqueness upfront
  const existingRows = await database.query<{ name: string }>(
    'SELECT name FROM subjects;',
  );
  const existingNames = existingRows.map(r => r.name);

  const validation = validateSubject(
    { name: input.name, color: input.color },
    { existingNames },
  );

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const id = createId();
  const createdAt = input.created_at ?? Date.now();
  const sortOrder = input.sort_order ?? 0;

  const newSubject: Subject = {
    id,
    name: validation.value.name,
    color: validation.value.color,
    sort_order: sortOrder,
    created_at: createdAt,
  };

  try {
    await database.exec(
      'INSERT INTO subjects (id, name, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?);',
      [
        newSubject.id,
        newSubject.name,
        newSubject.color,
        newSubject.sort_order,
        newSubject.created_at,
      ],
    );
    return { ok: true, value: newSubject };
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { ok: false, error: 'duplicate' };
    }
    throw err;
  }
}

/**
 * Updates an existing subject after validation.
 */
export async function updateSubject(
  id: string,
  input: UpdateSubjectInput,
  db?: Db,
): Promise<SubjectResult<Subject>> {
  const database = db ?? getDb();
  const existing = await getSubject(id, database);
  if (!existing) {
    return { ok: false, error: 'empty' };
  }

  const newName = input.name !== undefined ? input.name : existing.name;
  const newColor = input.color !== undefined ? input.color : existing.color;
  const newSortOrder =
    input.sort_order !== undefined ? input.sort_order : existing.sort_order;

  const existingRows = await database.query<{ name: string }>(
    'SELECT name FROM subjects WHERE id != ?;',
    [id],
  );
  const existingNames = existingRows.map(r => r.name);

  const validation = validateSubject(
    { name: newName, color: newColor },
    { existingNames, currentName: existing.name },
  );

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const updatedSubject: Subject = {
    id: existing.id,
    name: validation.value.name,
    color: validation.value.color,
    sort_order: newSortOrder,
    created_at: existing.created_at,
  };

  try {
    await database.exec(
      'UPDATE subjects SET name = ?, color = ?, sort_order = ? WHERE id = ?;',
      [
        updatedSubject.name,
        updatedSubject.color,
        updatedSubject.sort_order,
        updatedSubject.id,
      ],
    );
    return { ok: true, value: updatedSubject };
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { ok: false, error: 'duplicate' };
    }
    throw err;
  }
}

/**
 * Deletes a subject by ID.
 */
export async function deleteSubject(id: string, db?: Db): Promise<void> {
  const database = db ?? getDb();
  await database.exec('DELETE FROM subjects WHERE id = ?;', [id]);
}
