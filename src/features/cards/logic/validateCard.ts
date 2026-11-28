/**
 * Pure validation helpers for flashcards.
 * No React Native or database imports.
 */

export const CARD_TEXT_MAX_LEN = 500;

export type CardValidationError =
  | 'front_empty'
  | 'back_empty'
  | 'front_too_long'
  | 'back_too_long';

export type CardValidationResult =
  | { ok: true; value: { front: string; back: string } }
  | { ok: false; error: CardValidationError };

/**
 * Validates and trims card front and back fields:
 * - Both required after trimming.
 * - Maximum 500 characters each.
 */
export function validateCard(input: {
  front: unknown;
  back: unknown;
}): CardValidationResult {
  const trimmedFront = typeof input.front === 'string' ? input.front.trim() : '';
  if (trimmedFront.length === 0) {
    return { ok: false, error: 'front_empty' };
  }
  if (trimmedFront.length > CARD_TEXT_MAX_LEN) {
    return { ok: false, error: 'front_too_long' };
  }

  const trimmedBack = typeof input.back === 'string' ? input.back.trim() : '';
  if (trimmedBack.length === 0) {
    return { ok: false, error: 'back_empty' };
  }
  if (trimmedBack.length > CARD_TEXT_MAX_LEN) {
    return { ok: false, error: 'back_too_long' };
  }

  return {
    ok: true,
    value: {
      front: trimmedFront,
      back: trimmedBack,
    },
  };
}

/**
 * Case-insensitive, whitespace-trimmed check against existing card fronts
 * for soft duplicate warnings.
 */
export function isDuplicate(
  front: string,
  existingFronts: readonly string[],
): boolean {
  const normalized = front.trim().toLowerCase();
  if (normalized.length === 0) {
    return false;
  }
  return existingFronts.some(
    existing => existing.trim().toLowerCase() === normalized,
  );
}
