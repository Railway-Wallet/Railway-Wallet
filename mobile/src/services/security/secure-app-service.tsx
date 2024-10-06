import { isDefined } from "@railgun-community/shared-models";
import EncryptedStorage from "react-native-encrypted-storage";
import { getRandomBytes, SharedConstants, StorageService } from "@react-shared";
import { Constants } from "@utils/constants";
import { hashPasswordString } from "./hash-service";

export const getEncryptedPin = async (): Promise<string | null> => {
  const pin = await EncryptedStorage.getItem(Constants.PASSWORD_HASH_STORED);

  return pin;
};

export const setEncryptedPin = async (pin: string): Promise<string> => {
  const salt = await getRandomBytes(16);
  const hashPasswordStored = await hashPasswordString(pin, salt, 100000);

  await Promise.all([
    EncryptedStorage.setItem(
      Constants.PASSWORD_HASH_STORED,
      hashPasswordStored
    ),
    EncryptedStorage.setItem(Constants.PASSWORD_SALT, salt),
    StorageService.setItem(
      SharedConstants.NUM_ENTER_PIN_FAILED_ATTEMPTS,
      String(0)
    ),
    StorageService.setItem(SharedConstants.PIN_LOCKOUT_TIMESTAMP, String(0)),
  ]);

  return hashPasswordStored;
};

export const compareEncryptedPin = async (pin: string): Promise<boolean> => {
  const [storedHash, salt] = await Promise.all([
    EncryptedStorage.getItem(Constants.PASSWORD_HASH_STORED),
    EncryptedStorage.getItem(Constants.PASSWORD_SALT),
  ]);

  if (!isDefined(storedHash) || !isDefined(salt)) return false;

  const hashEnteredPin = await hashPasswordString(pin, salt, 100000);

  return storedHash === hashEnteredPin;
};

export const hasPinSet = async () => {
  const [hash, salt] = await Promise.all([
    EncryptedStorage.getItem(Constants.PASSWORD_HASH_STORED),
    EncryptedStorage.getItem(Constants.PASSWORD_SALT),
  ]);
  return isDefined(hash) && isDefined(salt);
};

export const resetPin = async () => {
  const hasPin = await hasPinSet();

  if (!hasPin) {
    return;
  }

  await Promise.all([
    EncryptedStorage.removeItem(Constants.PASSWORD_HASH_STORED),
    EncryptedStorage.removeItem(Constants.PASSWORD_SALT),
    StorageService.setItem(
      SharedConstants.NUM_ENTER_PIN_FAILED_ATTEMPTS,
      String(0)
    ),
    StorageService.setItem(SharedConstants.PIN_LOCKOUT_TIMESTAMP, String(0)),
  ]);
};

export const hasBiometricsEnabled = async () => {
  const value = await StorageService.getItem(Constants.BIOMETRICS_ENABLED);
  return value === Constants.ENABLED_STORAGE_VALUE;
};

export const setHasBiometricsEnabled = async (enabled: boolean) => {
  await StorageService.setItem(
    Constants.BIOMETRICS_ENABLED,
    enabled ? Constants.ENABLED_STORAGE_VALUE : Constants.DISABLED_STORAGE_VALUE
  );
};
