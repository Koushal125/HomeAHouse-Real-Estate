import '@testing-library/jest-dom';

// Node 22+ ships its own (limited) localStorage/sessionStorage globals that
// do not fully implement the Web Storage API.  Replacing them with a proper
// in-memory implementation ensures authSlice module-level calls (and any test
// that exercises storage) work correctly with jsdom.
const makeStorage = () => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] ?? null,
  };
};

Object.defineProperty(globalThis, 'localStorage',  { value: makeStorage(), writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: makeStorage(), writable: true });

