import localforage from 'localforage';

export class LocalForageWrapper {
  static init() {
    localforage.config({});
  }

  static getItem(key: string): Promise<string | null> {
    return localforage.getItem(key);
  }

  static async setItem(key: string, value: string): Promise<void> {
    await localforage.setItem(key, value);
  }

  static removeItem(key: string): Promise<void> {
    return localforage.removeItem(key);
  }
}
