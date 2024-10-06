import { isDefined } from "@railgun-community/shared-models";

type StorageServiceType = {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
};

export class StorageService {
  private static storage: StorageServiceType;

  static init = (storage: StorageServiceType) => {
    this.storage = storage;
  };

  static getItem = (name: string): Promise<string | null> => {
    if (!isDefined(this.storage)) {
      throw new Error(
        "Storage mechanism not set. Please call StorageService.init."
      );
    }
    return this.storage.getItem(name);
  };

  static setItem = (name: string, value: string): Promise<void> => {
    if (!isDefined(this.storage)) {
      throw new Error(
        "Storage mechanism not set. Please call StorageService.init."
      );
    }
    return this.storage.setItem(name, value);
  };

  static removeItem = (name: string): Promise<void> => {
    if (!isDefined(this.storage)) {
      throw new Error(
        "Storage mechanism not set. Please call StorageService.init."
      );
    }
    return this.storage.removeItem(name);
  };
}
