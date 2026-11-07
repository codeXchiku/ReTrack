import { subjectColors } from '@/core/theme';
import { validateSubject } from '@/features/subjects/logic/validateSubject';

describe('validateSubject', () => {
  const validColor = subjectColors[0]?.color ?? '#3B82F6';

  it('rejects empty string or non-string input with error "empty"', () => {
    expect(validateSubject({ name: '', color: validColor })).toEqual({
      ok: false,
      error: 'empty',
    });
    expect(validateSubject({ name: '   ', color: validColor })).toEqual({
      ok: false,
      error: 'empty',
    });
    expect(validateSubject({ name: null, color: validColor })).toEqual({
      ok: false,
      error: 'empty',
    });
  });

  it('accepts names with 1 to 30 characters and trims whitespace', () => {
    const thirtyChars = 'a'.repeat(30);
    const result30 = validateSubject({
      name: `  ${thirtyChars}  `,
      color: validColor,
    });
    expect(result30).toEqual({
      ok: true,
      value: {
        name: thirtyChars,
        color: validColor,
      },
    });

    const singleChar = validateSubject({ name: ' M ', color: validColor });
    expect(singleChar).toEqual({
      ok: true,
      value: {
        name: 'M',
        color: validColor,
      },
    });
  });

  it('rejects names with 31 or more characters with error "too_long"', () => {
    const thirtyOneChars = 'a'.repeat(31);
    const result = validateSubject({
      name: thirtyOneChars,
      color: validColor,
    });
    expect(result).toEqual({
      ok: false,
      error: 'too_long',
    });
  });

  it('detects duplicate names case-insensitively with error "duplicate"', () => {
    const existingNames = ['Mathematics', 'Physics', 'Chemistry'];

    const dupUpper = validateSubject(
      { name: 'PHYSICS', color: validColor },
      { existingNames },
    );
    expect(dupUpper).toEqual({
      ok: false,
      error: 'duplicate',
    });

    const dupTrimmed = validateSubject(
      { name: '  chemistry  ', color: validColor },
      { existingNames },
    );
    expect(dupTrimmed).toEqual({
      ok: false,
      error: 'duplicate',
    });

    const nonDup = validateSubject(
      { name: 'Biology', color: validColor },
      { existingNames },
    );
    expect(nonDup).toEqual({
      ok: true,
      value: {
        name: 'Biology',
        color: validColor,
      },
    });
  });

  it('allows keeping the same name when currentName is provided (edit mode)', () => {
    const existingNames = ['Mathematics', 'Physics'];

    const editSelf = validateSubject(
      { name: 'physics', color: validColor },
      { existingNames, currentName: 'Physics' },
    );
    expect(editSelf).toEqual({
      ok: true,
      value: {
        name: 'physics',
        color: validColor,
      },
    });

    const editCollision = validateSubject(
      { name: 'Mathematics', color: validColor },
      { existingNames, currentName: 'Physics' },
    );
    expect(editCollision).toEqual({
      ok: false,
      error: 'duplicate',
    });
  });

  it('rejects colors not in the 8-color palette with error "bad_color"', () => {
    expect(validateSubject({ name: 'History', color: '#000000' })).toEqual({
      ok: false,
      error: 'bad_color',
    });
    expect(validateSubject({ name: 'History', color: 'invalid' })).toEqual({
      ok: false,
      error: 'bad_color',
    });
    expect(validateSubject({ name: 'History', color: null })).toEqual({
      ok: false,
      error: 'bad_color',
    });
  });

  it('accepts any of the 8 theme palette colors', () => {
    expect(subjectColors).toHaveLength(8);
    for (const sc of subjectColors) {
      const byHex = validateSubject({ name: 'Art', color: sc.color });
      expect(byHex).toEqual({
        ok: true,
        value: {
          name: 'Art',
          color: sc.color,
        },
      });

      const byId = validateSubject({ name: 'Art', color: sc.id });
      expect(byId).toEqual({
        ok: true,
        value: {
          name: 'Art',
          color: sc.color,
        },
      });
    }
  });
});
