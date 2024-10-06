import { isDefined } from "@railgun-community/shared-models";
import * as fs from "react-native-fs";
import RNSecureKeyStore, { ACCESSIBLE } from "react-native-secure-key-store";
import { getRandomBytes, logDevError, store } from "@react-shared";
import { Constants } from "@utils/constants";

let dbPath: string;

const DB_ENCRYPTION_KEY_LENGTH_BYTES = 32;

export const getSecureNamedKey = (authKey: string) => {
  return Constants.DB_ENCRYPTION_KEY + "|" + authKey;
};

export const storeNewDbEncryptionKey = async (
  authKey: string,
  dbEncryptionKey: string,
  previousAuthKey?: string
) => {
  if (isDefined(previousAuthKey)) {
    await RNSecureKeyStore.remove(getSecureNamedKey(previousAuthKey)).catch(
      (err) => {
        logDevError(
          new Error(
            "Could not remove previous dbEncryptionKey from secure enclave",
            { cause: err }
          )
        );
      }
    );
  }

  await RNSecureKeyStore.set(getSecureNamedKey(authKey), dbEncryptionKey, {
    accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
};

export const getOrCreateDbEncryptionKey = async (): Promise<string> => {
  const { key: authKey } = store.getState().authKey;
  if (!isDefined(authKey)) {
    throw new Error("No auth key provided for decryption.");
  }

  try {
    const key = await RNSecureKeyStore.get(getSecureNamedKey(authKey));
    if (!isDefined(key)) {
      throw new Error("No key stored");
    }
    return key;
  } catch (err) {
    logDevError(
      new Error("Could not find previous key", {
        cause: err,
      })
    );
    const newDbEncryptionKey = await getRandomBytes(
      DB_ENCRYPTION_KEY_LENGTH_BYTES
    );
    await storeNewDbEncryptionKey(authKey, newDbEncryptionKey);
    return newDbEncryptionKey;
  }
};

export const createDbPath = async (): Promise<string> => {
  if (dbPath) {
    return dbPath;
  }
  const dbFolder = "rail.db";
  const path = `${fs.DocumentDirectoryPath}/${dbFolder}`;
  const pathExists = await fs.exists(path);
  if (!pathExists) {
    await fs.mkdir(path);
  }
  dbPath = path;
  return path;
};
