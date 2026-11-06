import { assert } from '@/core/utils/assert';
import { createId } from '@/core/utils/createId';
import { log } from '@/core/utils/log';

describe('Core Utils', () => {
  describe('createId', () => {
    it('generates non-empty unique string IDs', () => {
      const id1 = createId();
      const id2 = createId();

      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(6);
      expect(id1).not.toBe(id2);
    });

    it('generates multiple unique IDs in a batch', () => {
      const set = new Set<string>();
      for (let i = 0; i < 50; i++) {
        set.add(createId());
      }
      expect(set.size).toBe(50);
    });
  });

  describe('assert', () => {
    it('does not throw when condition is truthy', () => {
      expect(() => assert(true, 'should not throw')).not.toThrow();
      expect(() => assert(1, 'should not throw')).not.toThrow();
      expect(() => assert({}, 'should not throw')).not.toThrow();
    });

    it('throws with specified message when condition is falsy', () => {
      expect(() => assert(false, 'Condition failed')).toThrow('Condition failed');
      expect(() => assert(null, 'Null value')).toThrow('Null value');
      expect(() => assert(undefined, 'Undefined value')).toThrow('Undefined value');
    });
  });

  describe('log', () => {
    it('calls console methods without crashing', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      log.debug('test debug');
      log.info('test info');
      log.warn('test warn');
      log.error('test error');

      expect(debugSpy).toHaveBeenCalledWith('test debug');
      expect(infoSpy).toHaveBeenCalledWith('test info');
      expect(warnSpy).toHaveBeenCalledWith('test warn');
      expect(errorSpy).toHaveBeenCalledWith('test error');

      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});

