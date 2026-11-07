import { eventBus } from '@/core/events';
import { subjectColors } from '@/core/theme';
import * as repo from '@/features/subjects/data/subjectsRepo';
import {
  getSubjectSync,
  useSubjectsStore,
} from '@/features/subjects/store/subjectsStore';

jest.mock('@/features/subjects/data/subjectsRepo');

describe('subjectsStore', () => {
  const color1 = subjectColors[0]?.color ?? '#3B82F6';
  const color2 = subjectColors[1]?.color ?? '#EF4444';

  const mockedRepo = jest.mocked(repo);

  beforeEach(() => {
    eventBus.clear();
    useSubjectsStore.setState({
      subjects: [],
      status: 'idle',
    });
    jest.clearAllMocks();
  });

  it('loads subjects into store and updates status', async () => {
    const dummySubjects: repo.Subject[] = [
      {
        id: 's1',
        name: 'Math',
        color: color1,
        sort_order: 0,
        created_at: 1000,
      },
    ];
    mockedRepo.listSubjects.mockResolvedValueOnce(dummySubjects);

    await useSubjectsStore.getState().load();

    expect(useSubjectsStore.getState().status).toBe('ready');
    expect(useSubjectsStore.getState().subjects).toEqual(dummySubjects);
    expect(getSubjectSync('s1')?.name).toBe('Math');
    expect(getSubjectSync('non-existent')).toBeNull();
    expect(getSubjectSync(null)).toBeNull();
  });

  it('emits subjects/changed when adding a subject', async () => {
    const changedEvents: Array<Record<string, never>> = [];
    eventBus.on('subjects/changed', payload => {
      changedEvents.push(payload);
    });

    const newSubject: repo.Subject = {
      id: 's2',
      name: 'Physics',
      color: color1,
      sort_order: 0,
      created_at: 2000,
    };
    mockedRepo.createSubject.mockResolvedValueOnce({
      ok: true,
      value: newSubject,
    });

    const result = await useSubjectsStore.getState().add({
      name: 'Physics',
      color: color1,
    });

    expect(result.ok).toBe(true);
    expect(useSubjectsStore.getState().subjects).toContainEqual(newSubject);
    expect(changedEvents).toHaveLength(1);
  });

  it('emits subjects/changed when updating a subject', async () => {
    const changedEvents: Array<Record<string, never>> = [];
    eventBus.on('subjects/changed', payload => {
      changedEvents.push(payload);
    });

    useSubjectsStore.setState({
      subjects: [
        {
          id: 's3',
          name: 'Chem',
          color: color1,
          sort_order: 0,
          created_at: 3000,
        },
      ],
      status: 'ready',
    });

    const updatedSubject: repo.Subject = {
      id: 's3',
      name: 'Chemistry',
      color: color2,
      sort_order: 1,
      created_at: 3000,
    };
    mockedRepo.updateSubject.mockResolvedValueOnce({
      ok: true,
      value: updatedSubject,
    });

    const result = await useSubjectsStore.getState().update('s3', {
      name: 'Chemistry',
      color: color2,
    });

    expect(result.ok).toBe(true);
    expect(useSubjectsStore.getState().subjects[0]?.name).toBe('Chemistry');
    expect(changedEvents).toHaveLength(1);
  });

  it('emits both subjects/changed and subjects/deleted with subjectId when removing', async () => {
    const changedEvents: Array<Record<string, never>> = [];
    const deletedEvents: Array<{ subjectId: string }> = [];

    eventBus.on('subjects/changed', payload => {
      changedEvents.push(payload);
    });
    eventBus.on('subjects/deleted', payload => {
      deletedEvents.push(payload);
    });

    useSubjectsStore.setState({
      subjects: [
        {
          id: 's4',
          name: 'Bio',
          color: color1,
          sort_order: 0,
          created_at: 4000,
        },
      ],
      status: 'ready',
    });

    mockedRepo.deleteSubject.mockResolvedValueOnce();

    await useSubjectsStore.getState().remove('s4');

    expect(useSubjectsStore.getState().subjects).toHaveLength(0);
    expect(changedEvents).toHaveLength(1);
    expect(deletedEvents).toEqual([{ subjectId: 's4' }]);
  });
});
