export function createLocalStorageRepository(key, fallbackValue) {
  return {
    key,
    fallbackValue,
    load() {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallbackValue;
      } catch {
        return fallbackValue;
      }
    },
    save(value) {
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    }
  };
}
