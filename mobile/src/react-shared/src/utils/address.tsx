import { getAddress, zeroPadValue } from "ethers";
import {
  AvailableWallet,
  SavedAddress,
  ViewOnlyWallet,
} from "../models/wallet";

export const trimAddress = (address: string, bytes: number): string => {
  if (address.startsWith("0x")) {
    const addressFormatted = address.slice(2);
    return `0x${addressFormatted.slice(addressFormatted.length - bytes * 2)}`;
  }
  return address.slice(address.length - bytes * 2);
};

export const isRailgunAddress = (address: string) => {
  return address.startsWith("0zk");
};

export const findKnownWalletName = (
  address: string,
  availableWallets: AvailableWallet[],
  viewOnlyWallets: ViewOnlyWallet[],
  savedAddresses: SavedAddress[]
) => {
  const firstKnownAvailableWallet = availableWallets.find(
    (w) => w.ethAddress === address || w.railAddress === address
  );
  if (firstKnownAvailableWallet) {
    return firstKnownAvailableWallet.name;
  }

  const firstKnownViewOnlyWallet = viewOnlyWallets.find(
    (w) => w.railAddress === address
  );
  if (firstKnownViewOnlyWallet) {
    return firstKnownViewOnlyWallet.name;
  }

  const firstKnownSavedAddress = savedAddresses.find(
    (w) =>
      w.ethAddress === address ||
      w.railAddress === address ||
      w.externalResolvedAddress === address
  );
  if (firstKnownSavedAddress) {
    return firstKnownSavedAddress.name;
  }

  return undefined;
};

export const padAddressForTopicFilter = (address: string): string => {
  return zeroPadValue(getAddress(address), 32);
};
