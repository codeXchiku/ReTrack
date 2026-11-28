import {
  CARD_TEXT_MAX_LEN,
  isDuplicate,
  validateCard,
} from '@/features/cards';

describe('validateCard', () => {
  it('accepts valid trimmed front and back', () => {
    const res = validateCard({
      front: '  What is Ohm’s Law?  ',
      back: '  V = I * R  ',
    });
    expect(res).toEqual({
      ok: true,
      value: {
        front: 'What is Ohm’s Law?',
        back: 'V = I * R',
      },
    });
  });

  it('rejects empty or whitespace-only front', () => {
    expect(validateCard({ front: '', back: 'Answer' })).toEqual({
      ok: false,
      error: 'front_empty',
    });
    expect(validateCard({ front: '   \n\t  ', back: 'Answer' })).toEqual({
      ok: false,
      error: 'front_empty',
    });
    expect(validateCard({ front: null, back: 'Answer' })).toEqual({
      ok: false,
      error: 'front_empty',
    });
  });

  it('rejects empty or whitespace-only back', () => {
    expect(validateCard({ front: 'Question', back: '' })).toEqual({
      ok: false,
      error: 'back_empty',
    });
    expect(validateCard({ front: 'Question', back: '   ' })).toEqual({
      ok: false,
      error: 'back_empty',
    });
    expect(validateCard({ front: 'Question', back: undefined })).toEqual({
      ok: false,
      error: 'back_empty',
    });
  });

  it('enforces max 500 characters for front (500 vs 501)', () => {
    const exact500 = 'a'.repeat(CARD_TEXT_MAX_LEN);
    const over501 = 'a'.repeat(CARD_TEXT_MAX_LEN + 1);

    expect(validateCard({ front: exact500, back: 'Valid' })).toEqual({
      ok: true,
      value: { front: exact500, back: 'Valid' },
    });
    expect(validateCard({ front: over501, back: 'Valid' })).toEqual({
      ok: false,
      error: 'front_too_long',
    });
    // Padding spaces around 500 chars are trimmed before length check
    expect(validateCard({ front: `  ${exact500}  `, back: 'Valid' }).ok).toBe(
      true,
    );
  });

  it('enforces max 500 characters for back (500 vs 501)', () => {
    const exact500 = 'b'.repeat(CARD_TEXT_MAX_LEN);
    const over501 = 'b'.repeat(CARD_TEXT_MAX_LEN + 1);

    expect(validateCard({ front: 'Valid', back: exact500 })).toEqual({
      ok: true,
      value: { front: 'Valid', back: exact500 },
    });
    expect(validateCard({ front: 'Valid', back: over501 })).toEqual({
      ok: false,
      error: 'back_too_long',
    });
  });
});

describe('isDuplicate', () => {
  const existing = ['Newton’s First Law', 'Speed of Light', 'Mitosis'];

  it('detects duplicates ignoring case and outer whitespace', () => {
    expect(isDuplicate('newton’s first law', existing)).toBe(true);
    expect(isDuplicate('  SPEED OF LIGHT  ', existing)).toBe(true);
    expect(isDuplicate('mItOsIs', existing)).toBe(true);
  });

  it('returns false for unique or blank strings', () => {
    expect(isDuplicate('Meiosis', existing)).toBe(false);
    expect(isDuplicate('   ', existing)).toBe(false);
    expect(isDuplicate('Test', [])).toBe(false);
  });
});
