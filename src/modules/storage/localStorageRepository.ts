export interface LocalRepository<T> {
  hasValue(): Promise<boolean>;
  getAll(): Promise<T[]>;
  saveAll(items: T[]): Promise<void>;
  clear(): Promise<void>;
}

export const createLocalStorageRepository = <T>(storageKey: string): LocalRepository<T> => ({
  async hasValue() {
    return window.localStorage.getItem(storageKey) !== null;
  },
  async getAll() {
    const rawValue = window.localStorage.getItem(storageKey);
    return rawValue ? (JSON.parse(rawValue) as T[]) : [];
  },
  async saveAll(items) {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  },
  async clear() {
    window.localStorage.removeItem(storageKey);
  },
});
