const storage = new Map<string, string>();

export const LocalStorage = {
  getItem: jest.fn(async (key: string) => storage.get(key)),
  setItem: jest.fn(async (key: string, value: string) => {
    storage.set(key, value);
  }),
  removeItem: jest.fn(async (key: string) => {
    storage.delete(key);
  }),
  _clear: () => storage.clear(),
};

export const open = jest.fn();

export const getPreferenceValues = jest.fn();

export const showToast = jest.fn();

export const Toast = {
  Style: {
    Animated: "animated",
    Success: "success",
    Failure: "failure",
  },
};
