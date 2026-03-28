const Zotero = {
  Prefs: {
    get: jest.fn(),
    set: jest.fn(),
  },
  Notifier: {
    registerObserver: jest.fn(),
    unregisterObserver: jest.fn(),
  },
  Items: {
    get: jest.fn(),
  },
  URI: {
    getItemURI: jest.fn(),
  },
};
export default Zotero;
(globalThis as any).Zotero = Zotero;
