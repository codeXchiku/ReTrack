import { create } from 'zustand';
import { eventBus } from '@/core/events';
import {
  type CreateSubjectInput,
  type Subject,
  type SubjectResult,
  type UpdateSubjectInput,
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
} from '../data/subjectsRepo';

export type SubjectsStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SubjectsStoreState = {
  subjects: Subject[];
  status: SubjectsStatus;
  load: () => Promise<void>;
  add: (input: CreateSubjectInput) => Promise<SubjectResult<Subject>>;
  update: (
    id: string,
    input: UpdateSubjectInput,
  ) => Promise<SubjectResult<Subject>>;
  remove: (id: string) => Promise<void>;
};

export const useSubjectsStore = create<SubjectsStoreState>(set => ({
  subjects: [],
  status: 'idle',

  load: async () => {
    set({ status: 'loading' });
    try {
      const subjects = await listSubjects();
      set({ subjects, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },

  add: async (input: CreateSubjectInput) => {
    const result = await createSubject(input);
    if (result.ok) {
      set(state => ({
        subjects: [...state.subjects, result.value],
      }));
      eventBus.emit('subjects/changed', {});
    }
    return result;
  },

  update: async (id: string, input: UpdateSubjectInput) => {
    const result = await updateSubject(id, input);
    if (result.ok) {
      set(state => ({
        subjects: state.subjects.map(s => (s.id === id ? result.value : s)),
      }));
      eventBus.emit('subjects/changed', {});
    }
    return result;
  },

  remove: async (id: string) => {
    await deleteSubject(id);
    set(state => ({
      subjects: state.subjects.filter(s => s.id !== id),
    }));
    eventBus.emit('subjects/changed', {});
    eventBus.emit('subjects/deleted', { subjectId: id });
  },
}));

/**
 * Hook to read all subjects.
 */
export function useSubjects(): Subject[] {
  return useSubjectsStore(state => state.subjects);
}

/**
 * Hook to read a subject by ID.
 */
export function useSubject(id: string | null | undefined): Subject | null {
  return useSubjectsStore(state => {
    if (!id) {
      return null;
    }
    return state.subjects.find(s => s.id === id) ?? null;
  });
}

/**
 * Synchronously reads a subject from the store state.
 */
export function getSubjectSync(id: string | null | undefined): Subject | null {
  if (!id) {
    return null;
  }
  return useSubjectsStore.getState().subjects.find(s => s.id === id) ?? null;
}
