type StorageMap = Map<string, string>;

function createStorageArea(store: StorageMap): Storage {
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

const localStorageStore = new Map<string, string>();
const sessionStorageStore = new Map<string, string>();

const localStorageFixture = createStorageArea(localStorageStore);
const sessionStorageFixture = createStorageArea(sessionStorageStore);

export function installStorageFixtures() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorageFixture,
  });

  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: sessionStorageFixture,
  });
}

export function resetStorageFixtures() {
  localStorageFixture.clear();
  sessionStorageFixture.clear();
}
