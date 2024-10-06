import { AvailableWallet, FrontendWallet } from "../models/wallet";
import { WalletsState } from "../redux-store/reducers/wallets-reducer";

export const firstRailgunWalletIDForRailgunAddress = (
  availableWallets: AvailableWallet[],
  railgunAddress: string
): Optional<string> => {
  const wallets = availableWallets.filter(
    (w) => w.railAddress === railgunAddress
  );
  return wallets.length ? wallets[0].railWalletID : undefined;
};

export const firstWalletForRailgunWalletID = (
  wallets: WalletsState,
  railWalletID: string
): Optional<FrontendWallet> => {
  const matchedWallets = walletsForRailgunWalletID(wallets, railWalletID);
  return matchedWallets.length ? matchedWallets[0] : undefined;
};

export const walletsForRailgunWalletID = (
  wallets: WalletsState,
  railWalletID: string
): FrontendWallet[] => {
  return [...wallets.available, ...wallets.viewOnly].filter(
    (w) => w.railWalletID === railWalletID
  );
};

export const isRailgunWalletAddress = (address: string) => {
  return address.startsWith("0zk");
};
