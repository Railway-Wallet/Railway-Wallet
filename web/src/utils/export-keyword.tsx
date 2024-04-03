import { SharedConstants } from '@react-shared';
import { hashPasswordString } from '@services/security/hash-service';

export const createSharedKeyFromKeyword = async (
  keyWord: string,
  salt: string,
): Promise<Uint8Array> => {
  const keyWordHash = await hashPasswordString(keyWord, salt, 100000);
  const encodedKeyword = new TextEncoder().encode(keyWordHash);
  const sharedKey = new Uint8Array(encodedKeyword.buffer, 0, 32);
  return sharedKey;
};
