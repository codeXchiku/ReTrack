import { useSyncExternalStore } from 'react';
import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * Global MMKV storage instance for Study Dojo.
 */
export const kv = new MMKV({ id: 'studydojo' });

export function getString(key: string): string | undefined {
  return kv.getString(key);
}

export function setString(key: string, value: string): void {
  kv.set(key, value);
}

export function getNumber(key: string): number | undefined {
  return kv.getNumber(key);
}

export function setNumber(key: string, value: number): void {
  kv.set(key, value);
}

export function getBoolean(key: string): boolean | undefined {
  return kv.getBoolean(key);
}

export function setBoolean(key: string, value: boolean): void {
  kv.set(key, value);
}

export function getJSON<T>(key: string): T | undefined {
  const raw = kv.getString(key);
  if (raw === undefined) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function setJSON<T>(key: string, value: T): void {
  kv.set(key, JSON.stringify(value));
}

export function remove(key: string): void {
  kv.delete(key);
}

export function listKeys(): string[] {
  return kv.getAllKeys();
}

export function clearAll(): void {
  kv.clearAll();
}

export type Setting<T> = {
  get(): T;
  set(value: T): void;
  useValue(): T;
  subscribe(listener: (value: T) => void): () => void;
  reset(): void;
};

/**
 * Creates a type-safe persistent setting backed by JSON in MMKV.
 * Provides get, set, reset, reactive hook useValue(), and pub/sub.
 */
export function createSetting<T>(key: string, defaultValue: T): Setting<T> {
  const listeners = new Set<(value: T) => void>();

  const read = (): T => {
    const raw = kv.getString(key);
    if (raw === undefined) {
      return defaultValue;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  };

  let cachedValue: T = read();

  // Listen to cross-instance or external MMKV updates
  kv.addOnValueChangedListener(changedKey => {
    if (changedKey === key) {
      cachedValue = read();
      listeners.forEach(fn => fn(cachedValue));
    }
  });

  const get = (): T => cachedValue;

  const set = (value: T): void => {
    cachedValue = value;
    kv.set(key, JSON.stringify(value));
  };

  const reset = (): void => {
    cachedValue = defaultValue;
    kv.delete(key);
  };

  const subscribe = (listener: (value: T) => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const useValue = (): T => {
    return useSyncExternalStore(
      subscribe,
      get,
      () => defaultValue,
    );
  };

  return {
    get,
    set,
    useValue,
    subscribe,
    reset,
  };
}

/**
 * Zustand StateStorage adapter for MMKV.
 */
export const zustandMMKVStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = kv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    kv.set(name, value);
  },
  removeItem: (name: string): void => {
    kv.delete(name);
  },
};
