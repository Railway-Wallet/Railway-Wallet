import { useMemo } from "react";
import { findKnownWalletName } from "../../utils/address";
import { useReduxSelector } from "../hooks-redux";

export const useKnownWalletName = (address: string) => {
  const { wallets } = useReduxSelector("wallets");
  const { savedAddresses } = useReduxSelector("savedAddresses");

  const knownWalletName: Optional<string> = useMemo(() => {
    return findKnownWalletName(
      address,
      wallets.available,
      wallets.viewOnly,
      savedAddresses.current
    );
  }, [address, wallets, savedAddresses]);

  return { knownWalletName };
};
