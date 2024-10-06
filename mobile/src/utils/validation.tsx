import { getAddress } from "ethers";
import { validateRailgunAddress } from "@react-shared";

export const validateEthAddress = (address: string): boolean => {
  try {
    getAddress(address);
    return true;
  } catch (err) {
    return false;
  }
};

export const validateWalletAddress = async (
  address: string,
  isRailgun: boolean
): Promise<boolean> => {
  if (isRailgun) {
    return validateRailgunAddress(address);
  }
  return validateEthAddress(address);
};
