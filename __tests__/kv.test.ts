import {
  clearAll,
  createSetting,
  getBoolean,
  getJSON,
  getNumber,
  getString,
  listKeys,
  remove,
  setBoolean,
  setJSON,
  setNumber,
  setString,
  zustandMMKVStorage,
} from '@/core/storage';

describe('kv and createSetting', () => {
  beforeEach(() => {
    clearAll();
  });

  describe('createSetting', () => {
    it('returns default value when uninitialized', () => {
      const setting = createSetting('test.num', 42);
      expect(setting.get()).toBe(42);
    });

    it('sets and gets updated values', () => {
      const setting = createSetting('test.str', 'hello');
      expect(setting.get()).toBe('hello');

      setting.set('world');
      expect(setting.get()).toBe('world');
    });

    it('notifies subscribers on change and unregisters listener when unsubscribed', () => {
      const setting = createSetting('test.sub', 10);
      const listener = jest.fn();

      const unsubscribe = setting.subscribe(listener);
      setting.set(20);
      expect(listener).toHaveBeenCalledWith(20);

      setting.set(30);
      expect(listener).toHaveBeenCalledWith(30);
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
      setting.set(40);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('resets to defaultValue and notifies subscribers', () => {
      const setting = createSetting('test.reset', 'default');
      const listener = jest.fn();
      setting.subscribe(listener);

      setting.set('custom');
      expect(setting.get()).toBe('custom');
      expect(listener).toHaveBeenCalledWith('custom');

      setting.reset();
      expect(setting.get()).toBe('default');
      expect(listener).toHaveBeenCalledWith('default');
    });

    it('supports complex JSON structures', () => {
      type Config = { enabled: boolean; tags: string[] };
      const defaultConf: Config = { enabled: false, tags: ['a'] };
      const setting = createSetting<Config>('test.config', defaultConf);

      expect(setting.get()).toEqual(defaultConf);

      const updatedConf: Config = { enabled: true, tags: ['a', 'b', 'c'] };
      setting.set(updatedConf);
      expect(setting.get()).toEqual(updatedConf);
    });
  });

  describe('typed helpers', () => {
    it('manages strings', () => {
      expect(getString('k_str')).toBeUndefined();
      setString('k_str', 'val');
      expect(getString('k_str')).toBe('val');
      remove('k_str');
      expect(getString('k_str')).toBeUndefined();
    });

    it('manages numbers and booleans', () => {
      setNumber('k_num', 123.45);
      expect(getNumber('k_num')).toBe(123.45);

      setBoolean('k_bool', true);
      expect(getBoolean('k_bool')).toBe(true);
    });

    it('manages JSON', () => {
      const data = { user: 'Alice', age: 25 };
      setJSON('k_json', data);
      expect(getJSON('k_json')).toEqual(data);
    });

    it('lists keys and clears all', () => {
      setString('k1', 'v1');
      setString('k2', 'v2');
      const keys = listKeys();
      expect(keys).toContain('k1');
      expect(keys).toContain('k2');

      clearAll();
      expect(listKeys()).toHaveLength(0);
    });

    it('provides zustandMMKVStorage adapter', () => {
      zustandMMKVStorage.setItem('zustand_key', 'test_val');
      expect(zustandMMKVStorage.getItem('zustand_key')).toBe('test_val');
      zustandMMKVStorage.removeItem('zustand_key');
      expect(zustandMMKVStorage.getItem('zustand_key')).toBeNull();
    });
  });
});
