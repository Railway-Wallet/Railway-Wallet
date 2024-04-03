import { isDefined } from '@railgun-community/shared-models';
import { getRandomBytes } from '@railgun-community/wallet';
import {
  AppDispatch,
  FrontendWallet,
  ReactConfig,
  SharedConstants,
  StorageService,
  WalletService,
} from '@react-shared';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';
import { Constants } from '@utils/constants';
import { hashPasswordString } from './hash-service';

export const setPassword = async (password: string): Promise<string> => {
  const salt = getRandomBytes(16);
  const [dbEncryptionKey, hashPasswordStored] = await Promise.all([
    hashPasswordString(password, salt, 100000),
    hashPasswordString(password, salt, 1000000),
  ]);

  await Promise.all([
    StorageService.setItem(Constants.PASSWORD_HASH_STORED, hashPasswordStored),
    StorageService.setItem(Constants.PASSWORD_SALT, salt),
  ]);

  await StorageService.setItem(
    SharedConstants.NUM_ENTER_PIN_FAILED_ATTEMPTS,
    String(0),
  );
  await StorageService.setItem(
    SharedConstants.PIN_LOCKOUT_TIMESTAMP,
    String(0),
  );

  return dbEncryptionKey;
};

export const removePassword = async () => {
  await Promise.all([
    StorageService.removeItem(Constants.PASSWORD_HASH_STORED),
    StorageService.removeItem(Constants.PASSWORD_SALT),
  ]);
};

export const hasPassword = async () => {
  const [hash, salt] = await Promise.all([
    StorageService.getItem(Constants.PASSWORD_HASH_STORED),
    StorageService.getItem(Constants.PASSWORD_SALT),
  ]);

  return isDefined(hash) && isDefined(salt);
};

const updateWalletAuthKey = async (
  wallet: FrontendWallet,
  currentWalletSecureService: WalletSecureStorageWeb,
  newWalletSecureService: WalletSecureStorageWeb,
  dispatch: AppDispatch,
) => {
  const mnemonic = await currentWalletSecureService.getWalletMnemonic(wallet);

  await newWalletSecureService.deleteRailgunWalletByID(wallet.railWalletID);

  const railWalletInfo = await newWalletSecureService.createRailgunWallet(
    mnemonic,
    wallet.creationBlockNumbers,
  );

  const walletService = new WalletService(dispatch, newWalletSecureService);

  const updatedWallet = {
    ...wallet,
    railWalletID: railWalletInfo.id,
    isRailgunWalletLoaded: false,
  };

  await walletService.loadRailgunWalletForFrontendWallet(updatedWallet);
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  allWallets: FrontendWallet[],
  dispatch: AppDispatch,
) => {
  try {
    const [storedPasswordHash, storedSalt] = await Promise.all([
      StorageService.getItem(Constants.PASSWORD_HASH_STORED),
      StorageService.getItem(Constants.PASSWORD_SALT),
    ]);

    if (storedPasswordHash == null || storedSalt == null) {
      throw new Error('Error changing password');
    }

    const [dbEncryptionKey, hashPasswordStored] = await Promise.all([
      hashPasswordString(currentPassword, storedSalt, 100000),
      hashPasswordString(currentPassword, storedSalt, 1000000),
    ]);

    if (hashPasswordStored !== storedPasswordHash) {
      throw new Error('Password incorrect');
    }

    const newAuthKey = await setPassword(newPassword);
    const currentWalletSecureService = new WalletSecureStorageWeb(
      dbEncryptionKey,
    );
    const newWalletSecureService = new WalletSecureStorageWeb(newAuthKey);

    for (const wallet of allWallets) {
      await updateWalletAuthKey(
        wallet,
        currentWalletSecureService,
        newWalletSecureService,
        dispatch,
      );
    }
  } catch (err) {
    throw new Error('Error changing password', { cause: err });
  }
};

export const validatePassword = (password: string) => {
  if (password.length < 8) {
    return false;
  }

  if (password.length > 250) {
    return false;
  }

  const pattern1 = /^(?=.*[a-z])(?=.*[A-Z\d\W]).{8,}$/;
  const pattern2 = /^(?:(.)(?!\1+$)){10,}$/;

  return (pattern1.test(password) || pattern2.test(password) || ReactConfig.IS_DEV);
};
