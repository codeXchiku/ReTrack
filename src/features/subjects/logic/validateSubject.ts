import { subjectColors } from '@/core/theme';

export type SubjectValidationError =
  | 'empty'
  | 'too_long'
  | 'duplicate'
  | 'bad_color';

export type SubjectValidationResult =
  | { ok: true; value: { name: string; color: string } }
  | { ok: false; error: SubjectValidationError };

export type ValidateSubjectOptions = {
  /**
   * Existing subject names to check for duplicates (case-insensitive).
   */
  existingNames?: readonly string[];
  /**
   * Current name of the subject being edited (excluded from duplicate check).
   */
  currentName?: string;
};

/**
 * Validates a subject name and color according to Study Dojo rules:
 * - name: trimmed, 1-30 characters, unique ignoring case.
 * - color: must be one of the 8 palette colors in theme tokens.
 *
 * Never throws an error; returns a typed Result.
 */
export function validateSubject(
  input: { name: unknown; color: unknown },
  options: ValidateSubjectOptions = {},
): SubjectValidationResult {
  if (typeof input.name !== 'string') {
    return { ok: false, error: 'empty' };
  }

  const trimmedName = input.name.trim();

  if (trimmedName.length === 0) {
    return { ok: false, error: 'empty' };
  }

  if (trimmedName.length > 30) {
    return { ok: false, error: 'too_long' };
  }

  // Check uniqueness ignoring case
  if (options.existingNames && options.existingNames.length > 0) {
    const lowerName = trimmedName.toLowerCase();
    const lowerCurrent = options.currentName?.trim().toLowerCase();

    const isDuplicate = options.existingNames.some(existing => {
      const existingTrimmed = existing.trim().toLowerCase();
      if (lowerCurrent && existingTrimmed === lowerCurrent) {
        return false;
      }
      return existingTrimmed === lowerName;
    });

    if (isDuplicate) {
      return { ok: false, error: 'duplicate' };
    }
  }

  // Check color against 8 palette colors
  if (typeof input.color !== 'string') {
    return { ok: false, error: 'bad_color' };
  }

  const normalizedInputColor = input.color.trim().toLowerCase();
  const matchedPaletteColor = subjectColors.find(
    c =>
      c.color.toLowerCase() === normalizedInputColor ||
      c.id.toLowerCase() === normalizedInputColor,
  );

  if (!matchedPaletteColor) {
    return { ok: false, error: 'bad_color' };
  }

  return {
    ok: true,
    value: {
      name: trimmedName,
      color: matchedPaletteColor.color,
    },
  };
}
