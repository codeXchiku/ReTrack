/**
 * Public API for subjects feature.
 * All other features import ONLY from this file.
 */

export type {
  Subject,
  CreateSubjectInput,
  UpdateSubjectInput,
  SubjectResult,
} from './data/subjectsRepo';

export type {
  SubjectValidationError,
  SubjectValidationResult,
  ValidateSubjectOptions,
} from './logic/validateSubject';

export { validateSubject } from './logic/validateSubject';

export {
  useSubjects,
  useSubject,
  getSubjectSync,
  useSubjectsStore,
} from './store/subjectsStore';

export {
  SubjectChip,
  type SubjectChipProps,
} from './components/SubjectChip';

export {
  SubjectPicker,
  type SubjectPickerProps,
  NO_SUBJECT_LABEL,
} from './components/SubjectPicker';

export { subjectColors } from '@/core/theme';
