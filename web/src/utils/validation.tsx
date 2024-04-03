import { validateEthAddress, validateRailgunAddress } from '@react-shared';

export const validateWalletAddress = (
  address: string,
  isRailgun: boolean,
): Promise<boolean> => {
  if (isRailgun) {
    return validateRailgunAddress(address);
  }
  return validateEthAddress(address);
};
